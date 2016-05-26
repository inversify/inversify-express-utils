/// <reference path="../typings/index.d.ts" />
/// <reference path="../node_modules/inversify-dts/inversify/inversify.d.ts" />
/// <reference path="../node_modules/reflect-metadata/reflect-metadata.d.ts" />

import "reflect-metadata";

// test libraries
import * as sinon from "sinon";
import * as request from "supertest";
import { expect } from "chai";

// dependencies
import * as express from "express";
import { injectable, IKernel, Kernel } from "inversify";
import { InversifyExpressServer } from "../src/server";
import { RouteContainer } from "../src/route-container";
import { Controller, Method, Get, Post, Put, Patch, Head, Delete } from "../src/decorators";

describe("Integration Tests:", () => {
    let server: InversifyExpressServer;
    let kernel: IKernel;

    beforeEach((done) => {
        // refresh container and kernel
        RouteContainer.setInstance(undefined);
        kernel = new Kernel();
        done();
    });

    describe("Routing & Request Handling:", () => {

        it("should add a router to routeContainer", (done) => {
            @injectable()
            @Controller("/")
            class TestController { @Get("/") public getTest(req: express.Request, res: express.Response) { return "GET"; } }
            let routes = RouteContainer.getInstance().getRoutes();

            expect(routes.length).to.equal(1);
            expect(routes[0].router).to.not.be.undefined;
            expect(routes[0].path).to.equal("/");
            done();
        });


        it("should work for each shortcut decorator", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Get("/") public getTest(req: express.Request, res: express.Response) { res.send("GET"); }
                @Post("/") public postTest(req: express.Request, res: express.Response) { res.send("POST"); }
                @Put("/") public putTest(req: express.Request, res: express.Response) { res.send("PUT"); }
                @Patch("/") public patchTest(req: express.Request, res: express.Response) { res.send("PATCH"); }
                @Head("/") public headTest(req: express.Request, res: express.Response) { res.send("HEAD"); }
                @Delete("/") public deleteTest(req: express.Request, res: express.Response) { res.send("DELETE"); }
            }
            kernel.bind<TestController>("TestController").to(TestController);

            server = new InversifyExpressServer(kernel);
            let agent = request(server.build());

            let deleteFn = () => { agent.delete("/").expect(200, "DELETE", done); };
            let head = () => { agent.head("/").expect(200, "HEAD", deleteFn); };
            let patch = () => { agent.patch("/").expect(200, "PATCH", head); };
            let put = () => { agent.put("/").expect(200, "PUT", patch); };
            let post = () => { agent.post("/").expect(200, "POST", put); };
            let get = () => { agent.get("/").expect(200, "GET", post); };

            get();
        });


        it("should work for more obscure HTTP methods using the Method decorator", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Method("propfind", "/") public getTest(req: express.Request, res: express.Response) { res.send("PROPFIND"); }
            }
            kernel.bind<TestController>("TestController").to(TestController);

            server = new InversifyExpressServer(kernel);
            request(server.build())
                .propfind("/")
                .expect(200, "PROPFIND", done);
        });


        it("should use returned values as response", (done) => {
            let result = {"hello": "world"};

            @injectable()
            @Controller("/")
            class TestController {
                @Get("/") public getTest(req: express.Request, res: express.Response) { return result; }
            }
            kernel.bind<TestController>("TestController").to(TestController);

            server = new InversifyExpressServer(kernel);
            request(server.build())
                .get("/")
                .expect(200, JSON.stringify(result), done);
        });
    });


    describe("Middleware:", () => {
        let result: string;
        let middleware: any = {
            a: function (req: express.Request, res: express.Response, next: express.NextFunction) {
                result += "a";
                next();
            },
            b: function (req: express.Request, res: express.Response, next: express.NextFunction) {
                result += "b";
                next();
            },
            c: function (req: express.Request, res: express.Response, next: express.NextFunction) {
                result += "c";
                next();
            }
        };
        let spyA = sinon.spy(middleware, "a");
        let spyB = sinon.spy(middleware, "b");
        let spyC = sinon.spy(middleware, "c");

        beforeEach((done) => {
            result = "";
            spyA.reset();
            spyB.reset();
            spyC.reset();
            done();
        });

        it("should call method-level middleware correctly", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Get("/", spyA, spyB, spyC) public getTest(req: express.Request, res: express.Response) { res.send("GET"); }
            }
            kernel.bind<TestController>("TestController").to(TestController);

            server = new InversifyExpressServer(kernel);
            request(server.build())
                .get("/")
                .expect(200, "GET", function () {
                    expect(spyA.calledOnce).to.be.true;
                    expect(spyB.calledOnce).to.be.true;
                    expect(spyC.calledOnce).to.be.true;
                    expect(result).to.equal("abc");
                    done();
                });
        });


        it("should call controller-level middleware correctly", (done) => {
            @injectable()
            @Controller("/", spyA, spyB, spyC)
            class TestController {
                @Get("/") public getTest(req: express.Request, res: express.Response) { res.send("GET"); }
            }
            kernel.bind<TestController>("TestController").to(TestController);

            server = new InversifyExpressServer(kernel);
            request(server.build())
                .get("/")
                .expect(200, "GET", function () {
                    expect(spyA.calledOnce).to.be.true;
                    expect(spyB.calledOnce).to.be.true;
                    expect(spyC.calledOnce).to.be.true;
                    expect(result).to.equal("abc");
                    done();
                });
        });


        it("should call server-level middleware correctly", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Get("/") public getTest(req: express.Request, res: express.Response) { res.send("GET"); }
            }
            kernel.bind<TestController>("TestController").to(TestController);

            server = new InversifyExpressServer(kernel);

            server.setConfig((app) => {
               app.use(spyA);
               app.use(spyB);
               app.use(spyC);
            });

            request(server.build())
                .get("/")
                .expect(200, "GET", function () {
                    expect(spyA.calledOnce).to.be.true;
                    expect(spyB.calledOnce).to.be.true;
                    expect(spyC.calledOnce).to.be.true;
                    expect(result).to.equal("abc");
                    done();
                });
        });


        it("should call all middleware in correct order", (done) => {
            @injectable()
            @Controller("/", spyB)
            class TestController {
                @Get("/", spyC) public getTest(req: express.Request, res: express.Response) { res.send("GET"); }
            }
            kernel.bind<TestController>("TestController").to(TestController);

            server = new InversifyExpressServer(kernel);

            server.setConfig((app) => {
               app.use(spyA);
            });

            request(server.build())
                .get("/")
                .expect(200, "GET", function () {
                    expect(spyA.calledOnce).to.be.true;
                    expect(spyB.calledOnce).to.be.true;
                    expect(spyC.calledOnce).to.be.true;
                    expect(result).to.equal("abc");
                    done();
                });
        });
    });
});
