import "reflect-metadata";
import * as sinon from "sinon";
import * as request from "supertest";
import { expect } from "chai";
import * as inversify from "inversify";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import { injectable, Container } from "inversify";
import { interfaces } from "../src/interfaces";
import { InversifyExpressServer } from "../src/server";
import { Controller, Method, All, Get, Post, Put, Patch, Head, Delete, Request, Response, Params,
        RequestParam, RequestBody, QueryParam, RequestHeaders, Cookies, Next } from "../src/decorators";
import { TYPE, PARAMETER_TYPE } from "../src/constants";

describe("Integration Tests:", () => {
    let server: InversifyExpressServer;
    let container: inversify.interfaces.Container;

    beforeEach((done) => {
        // refresh container and container
        container = new Container();
        done();
    });

    describe("Routing & Request Handling:", () => {

        it("should work for async controller methods", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Get("/") public getTest(req: express.Request, res: express.Response) {
                    return new Promise(((resolve) => {
                        setTimeout(resolve, 100, "GET");
                    }));
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            request(server.build())
                .get("/")
                .expect(200, "GET", done);
        });

        it("should work for async controller methods that fails", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Get("/") public getTest(req: express.Request, res: express.Response) {
                    return new Promise(((resolve, reject) => {
                        setTimeout(reject, 100, "GET");
                    }));
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            request(server.build())
                .get("/")
                .expect(500, done);
        });


        it ("should work for methods which call next()", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Get("/") public getTest(req: express.Request, res: express.Response, next: express.NextFunction) {
                    next();
                }

                @Get("/") public getTest2(req: express.Request, res: express.Response) {
                    return "GET";
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            request(server.build())
                .get("/")
                .expect(200, "GET", done);
        });


        it ("should work for async methods which call next()", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Get("/") public getTest(req: express.Request, res: express.Response, next: express.NextFunction) {
                    return new Promise(((resolve) => {
                        setTimeout(() => {
                            next();
                            resolve();
                        }, 100, "GET");
                    }));
                }

                @Get("/") public getTest2(req: express.Request, res: express.Response) {
                    return "GET";
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            request(server.build())
                .get("/")
                .expect(200, "GET", done);
        });


        it ("should work for async methods called by next()", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Get("/") public getTest(req: express.Request, res: express.Response, next: express.NextFunction) {
                    next();
                }

                @Get("/") public getTest2(req: express.Request, res: express.Response) {
                    return new Promise(((resolve) => {
                        setTimeout(resolve, 100, "GET");
                    }));
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            request(server.build())
                .get("/")
                .expect(200, "GET", done);
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
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
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
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
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
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            request(server.build())
                .get("/")
                .expect(200, JSON.stringify(result), done);
        });

        it("should use custom router passed from configuration", () => {
            @injectable()
            @Controller("/CaseSensitive")
            class TestController {
                @Get("/Endpoint") public get() {
                    return "Such Text";
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            const customRouter = express.Router({
                caseSensitive: true
            });

            server = new InversifyExpressServer(container, customRouter);
            const app = server.build();

            const expectedSuccess = request(app)
                .get("/CaseSensitive/Endpoint")
                .expect(200, "Such Text");

            const expectedNotFound1 = request(app)
                .get("/casesensitive/endpoint")
                .expect(404);

            const expectedNotFound2 = request(app)
                .get("/CaseSensitive/endpoint")
                .expect(404);

            return Promise.all([
                expectedSuccess,
                expectedNotFound1,
                expectedNotFound2
            ]);

        });

        it("should use custom routing configuration", () => {
            @injectable()
            @Controller("/ping")
            class TestController {
                @Get("/endpoint") public get() {
                    return "pong";
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container, null, { rootPath: "/api/v1" });

            return request(server.build())
                .get("/api/v1/ping/endpoint")
                .expect(200, "pong");
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

        it("should call method-level middleware correctly (GET)", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Get("/", spyA, spyB, spyC) public getTest(req: express.Request, res: express.Response) { res.send("GET"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            let agent = request(server.build());

            agent.get("/")
                .expect(200, "GET", function () {
                    expect(spyA.calledOnce).to.be.true;
                    expect(spyB.calledOnce).to.be.true;
                    expect(spyC.calledOnce).to.be.true;
                    expect(result).to.equal("abc");
                    done();
                });
        });

        it("should call method-level middleware correctly (POST)", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Post("/", spyA, spyB, spyC) public postTest(req: express.Request, res: express.Response) { res.send("POST"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            let agent = request(server.build());

            agent.post("/")
                .expect(200, "POST", function () {
                    expect(spyA.calledOnce).to.be.true;
                    expect(spyB.calledOnce).to.be.true;
                    expect(spyC.calledOnce).to.be.true;
                    expect(result).to.equal("abc");
                    done();
                });
        });

        it("should call method-level middleware correctly (PUT)", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Put("/", spyA, spyB, spyC) public postTest(req: express.Request, res: express.Response) { res.send("PUT"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            let agent = request(server.build());

            agent.put("/")
                .expect(200, "PUT", function () {
                    expect(spyA.calledOnce).to.be.true;
                    expect(spyB.calledOnce).to.be.true;
                    expect(spyC.calledOnce).to.be.true;
                    expect(result).to.equal("abc");
                    done();
                });
        });

        it("should call method-level middleware correctly (PATCH)", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Patch("/", spyA, spyB, spyC) public postTest(req: express.Request, res: express.Response) { res.send("PATCH"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            let agent = request(server.build());

            agent.patch("/")
                .expect(200, "PATCH", function () {
                    expect(spyA.calledOnce).to.be.true;
                    expect(spyB.calledOnce).to.be.true;
                    expect(spyC.calledOnce).to.be.true;
                    expect(result).to.equal("abc");
                    done();
                });
        });

        it("should call method-level middleware correctly (HEAD)", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Head("/", spyA, spyB, spyC) public postTest(req: express.Request, res: express.Response) { res.send("HEAD"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            let agent = request(server.build());

            agent.head("/")
                .expect(200, "HEAD", function () {
                    expect(spyA.calledOnce).to.be.true;
                    expect(spyB.calledOnce).to.be.true;
                    expect(spyC.calledOnce).to.be.true;
                    expect(result).to.equal("abc");
                    done();
                });
        });

        it("should call method-level middleware correctly (DELETE)", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Delete("/", spyA, spyB, spyC) public postTest(req: express.Request, res: express.Response) { res.send("DELETE"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            let agent = request(server.build());

            agent.delete("/")
                .expect(200, "DELETE", function () {
                    expect(spyA.calledOnce).to.be.true;
                    expect(spyB.calledOnce).to.be.true;
                    expect(spyC.calledOnce).to.be.true;
                    expect(result).to.equal("abc");
                    done();
                });
        });

        it("should call method-level middleware correctly (ALL)", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @All("/", spyA, spyB, spyC) public postTest(req: express.Request, res: express.Response) { res.send("ALL"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            let agent = request(server.build());

            agent.get("/")
                .expect(200, "ALL", function () {
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
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
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
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);

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
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);

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

        it("should resolve controller-level middleware", () => {
            const symbolId = Symbol("spyA");
            const strId = "spyB";

            @injectable()
            @Controller("/", symbolId, strId)
            class TestController {
                @Get("/") public getTest(req: express.Request, res: express.Response) { res.send("GET"); }
            }

            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");
            container.bind<express.RequestHandler>(symbolId).toConstantValue(spyA);
            container.bind<express.RequestHandler>(strId).toConstantValue(spyB);

            server = new InversifyExpressServer(container);

            let agent = request(server.build());

            return agent.get("/")
                .expect(200, "GET")
                .then(() => {
                    expect(spyA.calledOnce).to.be.true;
                    expect(spyB.calledOnce).to.be.true;
                    expect(result).to.equal("ab");
                });
        });

        it("should resolve method-level middleware", () => {
            const symbolId = Symbol("spyA");
            const strId = "spyB";

            @injectable()
            @Controller("/")
            class TestController {
                @Get("/", symbolId, strId)
                public getTest(req: express.Request, res: express.Response) { res.send("GET"); }
            }

            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");
            container.bind<express.RequestHandler>(symbolId).toConstantValue(spyA);
            container.bind<express.RequestHandler>(strId).toConstantValue(spyB);

            server = new InversifyExpressServer(container);

            let agent = request(server.build());

            return agent.get("/")
                .expect(200, "GET")
                .then(() => {
                    expect(spyA.calledOnce).to.be.true;
                    expect(spyB.calledOnce).to.be.true;
                    expect(result).to.equal("ab");
                });
        });

        it("should compose controller- and method-level middleware", () => {
            const symbolId = Symbol("spyA");
            const strId = "spyB";

            @injectable()
            @Controller("/", symbolId)
            class TestController {
                @Get("/", strId)
                public getTest(req: express.Request, res: express.Response) { res.send("GET"); }
            }

            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");
            container.bind<express.RequestHandler>(symbolId).toConstantValue(spyA);
            container.bind<express.RequestHandler>(strId).toConstantValue(spyB);

            server = new InversifyExpressServer(container);

            let agent = request(server.build());

            return agent.get("/")
                .expect(200, "GET")
                .then(() => {
                    expect(spyA.calledOnce).to.be.true;
                    expect(spyB.calledOnce).to.be.true;
                    expect(result).to.equal("ab");
                });
        });
    });
    describe("Parameters:", () => {
        it("should bind a method parameter to the url parameter of the web request", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                // tslint:disable-next-line:max-line-length
                @Get(":id") public getTest( @RequestParam("id") id: string, req: express.Request, res: express.Response) {
                    return id;
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            request(server.build())
                .get("/foo")
                .expect(200, "foo", done);
        });

        it("should bind a method parameter to the request object", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Get(":id") public getTest(@Request() req: express.Request) {
                    return req.params.id;
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            request(server.build())
                .get("/GET")
                .expect(200, "GET", done);
        });

        it("should bind a method parameter to the response object", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Get("/") public getTest(@Response() res: express.Response) {
                    return res.send("foo");
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            request(server.build())
                .get("/")
                .expect(200, "foo", done);
        });

        it("should bind a method parameter to a query parameter", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Get("/") public getTest(@QueryParam("id") id: string) {
                    return id;
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            request(server.build())
                .get("/")
                .query("id=foo")
                .expect(200, "foo", done);
        });

        it("should bind a method parameter to the request body", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Post("/") public getTest(@RequestBody() body: string) {
                    return body;
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            let body = {foo: "bar"};
            server.setConfig((app) => {
                app.use(bodyParser.json());
            });
            request(server.build())
                .post("/")
                .send(body)
                .expect(200, body, done);
        });

        it("should bind a method parameter to the request headers", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Get("/") public getTest(@RequestHeaders("testhead") headers: any) {
                    return headers;
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            request(server.build())
                .get("/")
                .set("TestHead", "foo")
                .expect(200, "foo", done);
        });

        it("should bind a method parameter to a cookie", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Get("/") public getTest(req: express.Request, res: express.Response) {
                    res.cookie("cookie", "hey");
                    res.send();
                }

                @Get("/cookie") public getCookie(req: express.Request, res: express.Response) {
                    if (req.cookies.cookie) {
                        res.send(req.cookies.cookie);
                    } else {
                        res.send(":(");
                    }
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            server.setConfig((app) => {
                app.use(cookieParser());
            });
            request(server.build())
                .get("/")
                .expect("set-cookie", "cookie=hey; Path=/", done);
        });

        it("should bind a method parameter to the next function", (done) => {
            @injectable()
            @Controller("/")
            class TestController {
                @Get("/") public getTest(@Next() next: any) {
                    let err = new Error("foo");
                    return next();
                }
                @Get("/") public getResult() {
                    return "foo";
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            request(server.build())
                .get("/")
                .expect(200, "foo", done);
        });
    });

});
