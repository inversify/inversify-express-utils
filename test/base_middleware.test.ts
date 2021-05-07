import { expect } from "chai";
import * as async from "async";
import * as express from "express";
import { Container, injectable, inject, optional } from "inversify";
import * as supertest from "supertest";
import {
    InversifyExpressServer,
    controller,
    httpGet,
    BaseMiddleware,
    BaseHttpController,
    interfaces
} from "../src/index";
import { cleanUpMetadata } from "../src/utils";

describe("BaseMiddleware", () => {

    beforeEach((done) => {
        cleanUpMetadata();
        done();
    });

    it("Should be able to inject BaseMiddleware implementations", (done) => {

        const TYPES = {
            LoggerMiddleware: Symbol.for("LoggerMiddleware"),
            SomeDependency: Symbol.for("SomeDependency")
        };

        let principalInstanceCount = 0;

        class Principal implements interfaces.Principal {
            public details: any;
            public constructor(details: any) {
                this.details = details;
            }
            public isAuthenticated() {
                return Promise.resolve<boolean>(true);
            }
            public isResourceOwner(resourceId: any) {
                return Promise.resolve<boolean>(resourceId === 1111);
            }
            public isInRole(role: string) {
                return Promise.resolve<boolean>(role === "admin");
            }
        }

        @injectable()
        class CustomAuthProvider implements interfaces.AuthProvider {
            public getUser(
                req: express.Request,
                res: express.Response,
                next: express.NextFunction
            ) {
                principalInstanceCount = principalInstanceCount + 1;
                const principal = new Principal({
                    email: `test@test.com`
                });
                return Promise.resolve(principal);
            }
        }

        interface SomeDependency {
            name: string;
        }

        const logEntries: string[] = [];

        @injectable()
        class LoggerMiddleware extends BaseMiddleware {
            @inject(TYPES.SomeDependency) private readonly _someDependency!: SomeDependency;
            public handler(
                req: express.Request,
                res: express.Response,
                next: express.NextFunction
            ) {
                const email = this.httpContext.user.details.email;
                logEntries.push(`${email} => ${req.url} ${this._someDependency.name}`);
                next();
            }
        }

        @controller(
            "/",
            (req, res, next) => {
                logEntries.push("Hello from controller middleware!");
                next();
            }
        )
        class TestController extends BaseHttpController {
            @httpGet(
                "/",
                TYPES.LoggerMiddleware
            )
            public async getTest() {
                if (this.httpContext.user !== null) {
                    const email = this.httpContext.user.details.email;
                    const isAuthenticated = await this.httpContext.user.isAuthenticated();
                    logEntries.push(`${email} => isAuthenticated() => ${isAuthenticated}`);
                    return `${email}`;
                } else {
                    return null;
                }
            }
        }

        const container = new Container();

        container.bind<SomeDependency>(TYPES.SomeDependency)
            .toConstantValue({ name: "SomeDependency!" });

        container.bind<LoggerMiddleware>(TYPES.LoggerMiddleware)
            .to(LoggerMiddleware);

        const server = new InversifyExpressServer(
            container,
            null,
            null,
            null,
            CustomAuthProvider
        );

        supertest(server.build())
            .get("/")
            .expect(200, `test@test.com`, () => {
                expect(principalInstanceCount).eq(
                    1,
                    "Only one instance of HttpContext should be created per HTTP request!"
                );
                expect(logEntries.length).eq(3);
                expect(logEntries[0]).eq(
                    "Hello from controller middleware!",
                    "Expected controller action to be invoked 1st!"
                );
                expect(logEntries[1]).eq(
                    "test@test.com => / SomeDependency!",
                    "Expected action middleare to be invoked 2nd!"
                );
                expect(logEntries[2]).eq(
                    "test@test.com => isAuthenticated() => true",
                    "Expected action to be invoked 3rd!"
                );
                done();
            });
    });

    it("Should allow the middleware to inject services in a HTTP request scope", (done) => {

        const TRACE_HEADER = "X-Trace-Id";

        const TYPES = {
            TraceIdValue: Symbol.for("TraceIdValue"),
            TracingMiddleware: Symbol.for("TracingMiddleware"),
            Service: Symbol.for("Service"),
        };

        @injectable()
        class TracingMiddleware extends BaseMiddleware {

            public handler(
                req: express.Request,
                res: express.Response,
                next: express.NextFunction
            ) {
                setTimeout(() => {
                    this.bind<string>(TYPES.TraceIdValue)
                        .toConstantValue(`${req.header(TRACE_HEADER)}`);
                    next();
                }, someTimeBetween(0, 500));
            }
        }

        @injectable()
        class Service {
            constructor(@inject(TYPES.TraceIdValue) private readonly traceID: string) {
            }

            public doSomethingThatRequiresTheTraceID() {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve(this.traceID);
                    }, someTimeBetween(0, 500));
                });
            }
        }

        @controller("/")
        class TracingTestController extends BaseHttpController {

            constructor(@inject(TYPES.Service) private readonly service: Service) {
                super();
            }

            @httpGet(
                "/",
                TYPES.TracingMiddleware
            )
            public getTest() {
                return this.service.doSomethingThatRequiresTheTraceID();
            }
        }

        const container = new Container();

        container.bind<TracingMiddleware>(TYPES.TracingMiddleware).to(TracingMiddleware);
        container.bind<Service>(TYPES.Service).to(Service);
        container.bind<string>(TYPES.TraceIdValue).toConstantValue(undefined as any);

        const api = new InversifyExpressServer(container).build();

        const expectedRequests = 100;
        let handledRequests = 0;

        run(expectedRequests, (executionId: number) => {
            return supertest(api)
                .get("/")
                .set(TRACE_HEADER, `trace-id-${executionId}`)
                .expect(200, `trace-id-${executionId}`)
                .then(res => {
                    handledRequests++;
                });
        }, (err?: Error | null | undefined) => {
            expect(handledRequests).eq(
                expectedRequests,
                `Only ${handledRequests} out of ${expectedRequests} have been handled correctly`
            );
            done(err);
        });
    });

    it("Should not allow services injected into a HTTP request scope to be accessible outside the request scope", (done) => {

        const TYPES = {
            Transaction: Symbol.for("Transaction"),
            TransactionMiddleware: Symbol.for("TransactionMiddleware"),
        };

        class TransactionMiddleware extends BaseMiddleware {

            private count = 0;

            public handler(
                req: express.Request,
                res: express.Response,
                next: express.NextFunction
            ) {
                this.bind<string>(TYPES.Transaction)
                    .toConstantValue(`I am transaction #${++this.count}\n`);
                next();
            }
        }

        @controller("/")
        class TransactionTestController extends BaseHttpController {

            constructor(@inject(TYPES.Transaction) @optional() private transaction: string) {
                super();
            }

            @httpGet(
                "/1",
                TYPES.TransactionMiddleware
            )
            public getTest1() {
                return this.transaction;
            }

            @httpGet(
                "/2" // <= No middleware!
            )
            public getTest2() {
                return this.transaction;
            }
        }

        const container = new Container();

        container.bind<TransactionMiddleware>(TYPES.TransactionMiddleware).to(TransactionMiddleware);
        const app = new InversifyExpressServer(container).build();

        supertest(app)
            .get("/1")
            .expect(200, "I am transaction #1", () => {

                supertest(app)
                    .get("/1")
                    .expect(200, "I am transaction #2", () => {

                        supertest(app)
                            .get("/2")
                            .expect(200, "", () => done());
                    });
            });

    });
});


function run(parallelRuns: number, test: (executionId: number) => PromiseLike<any>, done: (error?: Error | null | undefined) => void) {
    const testTaskNo = (id: number) => function (cb: (err?: Error | null | undefined) => void) {
        test(id).then(cb, cb);
    };

    const testTasks = Array.from({ length: parallelRuns }, (val: undefined, key: number) => testTaskNo(key));

    async.parallel(testTasks, done);
}

function someTimeBetween(minimum: number, maximum: number) {
    const min = Math.ceil(minimum);
    const max = Math.floor(maximum);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

