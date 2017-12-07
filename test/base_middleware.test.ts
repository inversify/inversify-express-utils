import { expect } from "chai";
import * as express from "express";
import { Container, injectable, inject } from "inversify";
import * as supertest from "supertest";
import {
    InversifyExpressServer,
    TYPE,
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

        interface SomeDependency {
            name: string;
        }

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
            @inject(TYPES.SomeDependency) private readonly _someDependency: SomeDependency;
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

});
