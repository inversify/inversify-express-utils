import { expect } from "chai";
import * as express from "express";
import { Container, injectable, inject } from "inversify";
import * as supertest from "supertest";
import {
    InversifyExpressServer,
    TYPE,
    controller,
    httpGet,
    BaseHttpController,
    interfaces,
    httpContext
} from "../src/index";

describe("AuthProvider", () => {

    it("Should be able to access current user via HttpContext", (done) => {

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
            @inject("SomeDependency") private readonly _someDependency: SomeDependency;
            public getUser(
                req: express.Request,
                res: express.Response,
                next: express.NextFunction
            ) {
                const principal = new Principal({
                    email: `${this._someDependency.name}@test.com`
                });
                return Promise.resolve(principal);
            }
        }

        interface SomeDependency {
            name: string;
        }

        @injectable()
        @controller("/")
        class TestController extends BaseHttpController {

            @inject("SomeDependency") private readonly _someDependency: SomeDependency;

            @httpGet("/")
            public async getTest() {
                if (this.httpContext.user !== null) {
                    const email = this.httpContext.user.details.email;
                    const name = this._someDependency.name;
                    const isAuthenticated = await this.httpContext.user.isAuthenticated();
                    expect(isAuthenticated).eq(true);
                    return `${email} & ${name}`;
                }
            }
        }

        const container = new Container();

        container.bind<SomeDependency>("SomeDependency")
                .toConstantValue({ name: "SomeDependency!" });

        container.bind<interfaces.Controller>(TYPE.Controller)
                 .to(TestController)
                 .whenTargetNamed("TestController");

        const server = new InversifyExpressServer(
            container,
            null,
            null,
            null,
            CustomAuthProvider
        );

        supertest(server.build())
            .get("/")
            .expect(200, `SomeDependency!@test.com & SomeDependency!`, done);

    });

});
