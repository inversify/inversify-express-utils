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
    interfaces
} from "../src/index";
import { cleanUpMetadata } from "../src/utils";
import {httpContextAccessDecoratorFactory, inRole, isAuthenticated, isResourceOwner} from "../src/decorators";
import AuthProvider = interfaces.AuthProvider;

describe("AuthProvider", () => {

    beforeEach((done) => {
        cleanUpMetadata();
        done();
    });

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

        @controller("/")
        class TestController extends BaseHttpController {

            @inject("SomeDependency") private readonly _someDependency: SomeDependency;

            @httpGet("/")
            public async getTest() {
                if (this.httpContext.user !== null) {
                    const email = this.httpContext.user.details.email;
                    const name = this._someDependency.name;
                    const _isAuthenticated = await this.httpContext.user.isAuthenticated();
                    expect(_isAuthenticated).eq(true);
                    return `${email} & ${name}`;
                }
            }
        }

        const container = new Container();

        container.bind<SomeDependency>("SomeDependency")
                .toConstantValue({ name: "SomeDependency!" });

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

    describe("Principal`s decorators", () => {
        class Principal implements interfaces.Principal {
            public details: any;
            public constructor(details: any) {
                this.details = details;
            }
            public isAuthenticated() {
                return Promise.resolve<boolean>(!!this.details._id);
            }
            public isResourceOwner(resourceId: any) {
                return Promise.resolve<boolean>(this.details.resourceIds.indexOf(resourceId) > -1);
            }
            public isInRole(role: string) {
                return Promise.resolve<boolean>(this.details.roles.indexOf(role) > -1);
            }
        }

        interface IUserDetails {
            _id: number;
            resourceIds?: string[];
            roles?: string[];
        }

        @injectable()
        class CustomAuthProvider implements interfaces.AuthProvider {

            @inject("UserDetails") private readonly _details: IUserDetails;

            public getUser(
                req: express.Request,
                res: express.Response,
                next: express.NextFunction
            ) {
                const principal = new Principal(this._details);
                return Promise.resolve(principal);
            }
        }

        function userExists (pass = true): any {
            return httpContextAccessDecoratorFactory(async (context) => {
                return (await context.user.isAuthenticated() && pass);
            });
        }

        @controller("/")
        class TestController extends BaseHttpController {
            @httpGet("userExists")
            @userExists()
            public async userExists() {
                return this.ok("OK");
            }

            @httpGet("isAuthenticated")
            @isAuthenticated()
            public async isAuthenticated() {
                return this.ok("OK");
            }

            @httpGet("isResourceOwner")
            @isResourceOwner("2301")
            public async isResourceOwner() {
                return this.ok("OK");
            }

            @httpGet("inRole")
            @inRole("admin")
            public async inRole() {
                return this.ok("OK");
            }
        }

        const container = new Container();
        container.bind<IUserDetails>("UserDetails")
            .toConstantValue({ _id: 1 });


        const server = new InversifyExpressServer(
            container,
            null,
            null,
            null,
            CustomAuthProvider
        );
        const app = server.build();
        const authProvider = container.get<CustomAuthProvider>(TYPE.AuthProvider);

        describe("Custom decorator", () => {
            it("Rejected", (done) => {
                container.rebind<IUserDetails>("UserDetails")
                    .toConstantValue({ _id: 0});
                expect(true).eq(true);

                supertest(app)
                    .get("/userExists")
                    .expect(403)
                    .end(done);
            });

            it("Accepted", (done) => {
                container.rebind<IUserDetails>("UserDetails")
                    .toConstantValue({ _id: 1});
                expect(true).eq(true);

                supertest(app)
                    .get("/userExists")
                    .expect(200, `"OK"`, done);
            });
        });

        describe("IsAuthenticated", () => {
            it("Rejected", (done) => {
                container.rebind<IUserDetails>("UserDetails")
                    .toConstantValue({ _id: 0});
                expect(true).eq(true);

                supertest(app)
                    .get("/isAuthenticated")
                    .expect(403)
                    .end(done);
            });

            it("Accepted", (done) => {
                container.rebind<IUserDetails>("UserDetails")
                    .toConstantValue({ _id: 1});
                expect(true).eq(true);

                supertest(app)
                    .get("/isAuthenticated")
                    .expect(200, `"OK"`, done);
            });
        });

        describe("IsResorceOwner", () => {
            it("Rejected", (done) => {
                container.rebind<IUserDetails>("UserDetails").toConstantValue({
                    _id: 1,
                    resourceIds: ["2909"]
                });
                expect(true).eq(true);

                supertest(app)
                    .get("/isResourceOwner")
                    .expect(403)
                    .end(done);
            });

            it("Accepted", (done) => {
                container.rebind<IUserDetails>("UserDetails").toConstantValue({
                    _id: 1,
                    resourceIds: ["2301"]
                });
                expect(true).eq(true);

                supertest(app)
                    .get("/isResourceOwner")
                    .expect(200, `"OK"`, done);
            });
        });

        describe("IsRole", () => {
            it("Rejected", (done) => {
                container.rebind<IUserDetails>("UserDetails").toConstantValue({
                    _id: 1,
                    roles: ["manager"]
                });
                expect(true).eq(true);

                supertest(app)
                    .get("/inRole")
                    .expect(403)
                    .end(done);
            });

            it("Accepted", (done) => {
                container.rebind<IUserDetails>("UserDetails").toConstantValue({
                    _id: 1,
                    roles: ["admin"]
                });
                expect(true).eq(true);

                supertest(app)
                    .get("/inRole")
                    .expect(200, `"OK"`, done);
            });
        });
    });

});
