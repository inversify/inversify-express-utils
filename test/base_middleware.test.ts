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

describe("BaseMiddleware", () => {

    it("Should be able to inject BaseMiddleware implementations", (done) => {

        const TYPES = {
            LoggerMiddleware: Symbol("LoggerMiddleware"),
            SomeDependency: Symbol("SomeDependency")
        };

        interface SomeDependency {
            name: string;
        }

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

        @injectable()
        @controller(
            "/",
            (req, res, next) => {
                logEntries.push("Hello from controller!");
                next();
            }
        )
        class TestController extends BaseHttpController {
            @httpGet(
                "/testUrl" // ,
                // TYPES.LoggerMiddleware
            )
            public async getTest() {
                if (this.httpContext.user !== null) {
                    const email = this.httpContext.user.details.email;
                    const isAuthenticated = await this.httpContext.user.isAuthenticated();
                    expect(isAuthenticated).eq(true);
                    return `${email}`;
                }
            }
        }

        const container = new Container();

        container.bind<SomeDependency>(TYPES.SomeDependency)
                .toConstantValue({ name: "SomeDependency!" });

        container.bind<interfaces.Controller>(TYPE.Controller)
                    .to(TestController)
                    .whenTargetNamed("TestController");

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
            .get("/testUrl")
            .expect(200, `test@test.com`, () => {
                expect(logEntries.length).eq(2);
                expect(logEntries[1]).eq("Hello from controller!");
                expect(logEntries[0]).eq(`test@test.com => /testUrl SomeDependency!`);
                done();
            });

    });

});
