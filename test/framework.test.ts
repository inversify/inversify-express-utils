import "reflect-metadata";
import * as sinon from "sinon";
import * as supertest from "supertest";
import { expect } from "chai";
import * as inversify from "inversify";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import { injectable, Container } from "inversify";
import { interfaces } from "../src/interfaces";
import { InversifyExpressServer } from "../src/server";
import { controller, httpMethod, all, httpGet, httpPost, httpPut, httpPatch,
        httpHead, httpDelete, request, response, params, requestParam,
        requestBody, queryParam, requestHeaders, cookies,
        next } from "../src/decorators";
import { TYPE, PARAMETER_TYPE } from "../src/constants";
import * as Bluebird from "bluebird";

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
            @controller("/")
            class TestController {
                @httpGet("/") public getTest(req: express.Request, res: express.Response) {
                    return new Promise(((resolve) => {
                        setTimeout(resolve, 100, "GET");
                    }));
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .expect(200, "GET", done);
        });

        it("should work for async controller methods that fails", (done) => {
            @injectable()
            @controller("/")
            class TestController {
                @httpGet("/") public getTest(req: express.Request, res: express.Response) {
                    return new Promise(((resolve, reject) => {
                        setTimeout(reject, 100, "GET");
                    }));
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .expect(500, done);
        });

        it("should work for async controller methods using non-native Bluebird promise", (done) => {
            @injectable()
            @controller("/")
            class TestController {
                @httpGet("/") public getTest(req: express.Request, res: express.Response) {
                    return new Bluebird(((resolve) => {
                        setTimeout(resolve, 100, "GET");
                    }));
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .expect(200, "GET", done);
        });

        it("should work for async controller methods, using non-native Bluebird promise, that fails", (done) => {
            @injectable()
            @controller("/")
            class TestController {
                @httpGet("/") public getTest(req: express.Request, res: express.Response) {
                    return new Bluebird(((resolve, reject) => {
                        setTimeout(reject, 100, "GET");
                    }));
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .expect(500, done);
        });

        it ("should work for methods which call nextFunc()", (done) => {
            @injectable()
            @controller("/")
            class TestController {
                @httpGet("/") public getTest(req: express.Request, res: express.Response, nextFunc: express.NextFunction) {
                    nextFunc();
                }

                @httpGet("/") public getTest2(req: express.Request, res: express.Response) {
                    return "GET";
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .expect(200, "GET", done);
        });


        it ("should work for async methods which call nextFunc()", (done) => {
            @injectable()
            @controller("/")
            class TestController {
                @httpGet("/") public getTest(req: express.Request, res: express.Response, nextFunc: express.NextFunction) {
                    return new Promise(((resolve) => {
                        setTimeout(() => {
                            nextFunc();
                            resolve();
                        }, 100, "GET");
                    }));
                }

                @httpGet("/") public getTest2(req: express.Request, res: express.Response) {
                    return "GET";
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .expect(200, "GET", done);
        });


        it ("should work for async methods called by nextFunc()", (done) => {
            @injectable()
            @controller("/")
            class TestController {
                @httpGet("/") public getTest(req: express.Request, res: express.Response, nextFunc: express.NextFunction) {
                    nextFunc();
                }

                @httpGet("/") public getTest2(req: express.Request, res: express.Response) {
                    return new Promise(((resolve) => {
                        setTimeout(resolve, 100, "GET");
                    }));
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .expect(200, "GET", done);
        });


        it("should work for each shortcut decorator", (done) => {
            @injectable()
            @controller("/")
            class TestController {
                @httpGet("/") public getTest(req: express.Request, res: express.Response) { res.send("GET"); }
                @httpPost("/") public postTest(req: express.Request, res: express.Response) { res.send("POST"); }
                @httpPut("/") public putTest(req: express.Request, res: express.Response) { res.send("PUT"); }
                @httpPatch("/") public patchTest(req: express.Request, res: express.Response) { res.send("PATCH"); }
                @httpHead("/") public headTest(req: express.Request, res: express.Response) { res.send("HEAD"); }
                @httpDelete("/") public deleteTest(req: express.Request, res: express.Response) { res.send("DELETE"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            let agent = supertest(server.build());

            let deleteFn = () => { agent.delete("/").expect(200, "DELETE", done); };
            let head = () => { agent.head("/").expect(200, "HEAD", deleteFn); };
            let patch = () => { agent.patch("/").expect(200, "PATCH", head); };
            let put = () => { agent.put("/").expect(200, "PUT", patch); };
            let post = () => { agent.post("/").expect(200, "POST", put); };
            let get = () => { agent.get("/").expect(200, "GET", post); };

            get();
        });


        it("should work for more obscure HTTP methods using the httpMethod decorator", (done) => {
            @injectable()
            @controller("/")
            class TestController {
                @httpMethod("propfind", "/") public getTest(req: express.Request, res: express.Response) { res.send("PROPFIND"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .propfind("/")
                .expect(200, "PROPFIND", done);
        });


        it("should use returned values as response", (done) => {
            let result = {"hello": "world"};

            @injectable()
            @controller("/")
            class TestController {
                @httpGet("/") public getTest(req: express.Request, res: express.Response) { return result; }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .expect(200, JSON.stringify(result), done);
        });

        it("should use custom router passed from configuration", () => {
            @injectable()
            @controller("/CaseSensitive")
            class TestController {
                @httpGet("/Endpoint") public get() {
                    return "Such Text";
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            const customRouter = express.Router({
                caseSensitive: true
            });

            server = new InversifyExpressServer(container, customRouter);
            const app = server.build();

            const expectedSuccess = supertest(app)
                .get("/CaseSensitive/Endpoint")
                .expect(200, "Such Text");

            const expectedNotFound1 = supertest(app)
                .get("/casesensitive/endpoint")
                .expect(404);

            const expectedNotFound2 = supertest(app)
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
            @controller("/ping")
            class TestController {
                @httpGet("/endpoint") public get() {
                    return "pong";
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container, null, { rootPath: "/api/v1" });

            return supertest(server.build())
                .get("/api/v1/ping/endpoint")
                .expect(200, "pong");
        });
    });


    describe("Middleware:", () => {
        let result: string;
        let middleware: any = {
            a: function (req: express.Request, res: express.Response, nextFunc: express.NextFunction) {
                result += "a";
                nextFunc();
            },
            b: function (req: express.Request, res: express.Response, nextFunc: express.NextFunction) {
                result += "b";
                nextFunc();
            },
            c: function (req: express.Request, res: express.Response, nextFunc: express.NextFunction) {
                result += "c";
                nextFunc();
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
            @controller("/")
            class TestController {
                @httpGet("/", spyA, spyB, spyC) public getTest(req: express.Request, res: express.Response) { res.send("GET"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            let agent = supertest(server.build());

            agent.get("/")
                .expect(200, "GET", function () {
                    expect(spyA.calledOnce).to.eqls(true);
                    expect(spyB.calledOnce).to.eqls(true);
                    expect(spyC.calledOnce).to.eqls(true);
                    expect(result).to.equal("abc");
                    done();
                });
        });

        it("should call method-level middleware correctly (POST)", (done) => {
            @injectable()
            @controller("/")
            class TestController {
                @httpPost("/", spyA, spyB, spyC) public postTest(req: express.Request, res: express.Response) { res.send("POST"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            let agent = supertest(server.build());

            agent.post("/")
                .expect(200, "POST", function () {
                    expect(spyA.calledOnce).to.eqls(true);
                    expect(spyB.calledOnce).to.eqls(true);
                    expect(spyC.calledOnce).to.eqls(true);
                    expect(result).to.equal("abc");
                    done();
                });
        });

        it("should call method-level middleware correctly (PUT)", (done) => {
            @injectable()
            @controller("/")
            class TestController {
                @httpPut("/", spyA, spyB, spyC) public postTest(req: express.Request, res: express.Response) { res.send("PUT"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            let agent = supertest(server.build());

            agent.put("/")
                .expect(200, "PUT", function () {
                    expect(spyA.calledOnce).to.eqls(true);
                    expect(spyB.calledOnce).to.eqls(true);
                    expect(spyC.calledOnce).to.eqls(true);
                    expect(result).to.equal("abc");
                    done();
                });
        });

        it("should call method-level middleware correctly (PATCH)", (done) => {
            @injectable()
            @controller("/")
            class TestController {
                @httpPatch("/", spyA, spyB, spyC) public postTest(req: express.Request, res: express.Response) { res.send("PATCH"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            let agent = supertest(server.build());

            agent.patch("/")
                .expect(200, "PATCH", function () {
                    expect(spyA.calledOnce).to.eqls(true);
                    expect(spyB.calledOnce).to.eqls(true);
                    expect(spyC.calledOnce).to.eqls(true);
                    expect(result).to.equal("abc");
                    done();
                });
        });

        it("should call method-level middleware correctly (HEAD)", (done) => {
            @injectable()
            @controller("/")
            class TestController {
                @httpHead("/", spyA, spyB, spyC) public postTest(req: express.Request, res: express.Response) { res.send("HEAD"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            let agent = supertest(server.build());

            agent.head("/")
                .expect(200, "HEAD", function () {
                    expect(spyA.calledOnce).to.eqls(true);
                    expect(spyB.calledOnce).to.eqls(true);
                    expect(spyC.calledOnce).to.eqls(true);
                    expect(result).to.equal("abc");
                    done();
                });
        });

        it("should call method-level middleware correctly (DELETE)", (done) => {
            @injectable()
            @controller("/")
            class TestController {
                @httpDelete("/", spyA, spyB, spyC) public postTest(req: express.Request, res: express.Response) { res.send("DELETE"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            let agent = supertest(server.build());

            agent.delete("/")
                .expect(200, "DELETE", function () {
                    expect(spyA.calledOnce).to.eqls(true);
                    expect(spyB.calledOnce).to.eqls(true);
                    expect(spyC.calledOnce).to.eqls(true);
                    expect(result).to.equal("abc");
                    done();
                });
        });

        it("should call method-level middleware correctly (ALL)", (done) => {
            @injectable()
            @controller("/")
            class TestController {
                @all("/", spyA, spyB, spyC) public postTest(req: express.Request, res: express.Response) { res.send("ALL"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            let agent = supertest(server.build());

            agent.get("/")
                .expect(200, "ALL", function () {
                    expect(spyA.calledOnce).to.eqls(true);
                    expect(spyB.calledOnce).to.eqls(true);
                    expect(spyC.calledOnce).to.eqls(true);
                    expect(result).to.equal("abc");
                    done();
                });
        });


        it("should call controller-level middleware correctly", (done) => {
            @injectable()
            @controller("/", spyA, spyB, spyC)
            class TestController {
                @httpGet("/") public getTest(req: express.Request, res: express.Response) { res.send("GET"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .expect(200, "GET", function () {
                    expect(spyA.calledOnce).to.eqls(true);
                    expect(spyB.calledOnce).to.eqls(true);
                    expect(spyC.calledOnce).to.eqls(true);
                    expect(result).to.equal("abc");
                    done();
                });
        });


        it("should call server-level middleware correctly", (done) => {
            @injectable()
            @controller("/")
            class TestController {
                @httpGet("/") public getTest(req: express.Request, res: express.Response) { res.send("GET"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);

            server.setConfig((app) => {
               app.use(spyA);
               app.use(spyB);
               app.use(spyC);
            });

            supertest(server.build())
                .get("/")
                .expect(200, "GET", function () {
                    expect(spyA.calledOnce).to.eqls(true);
                    expect(spyB.calledOnce).to.eqls(true);
                    expect(spyC.calledOnce).to.eqls(true);
                    expect(result).to.equal("abc");
                    done();
                });
        });


        it("should call all middleware in correct order", (done) => {
            @injectable()
            @controller("/", spyB)
            class TestController {
                @httpGet("/", spyC) public getTest(req: express.Request, res: express.Response) { res.send("GET"); }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);

            server.setConfig((app) => {
               app.use(spyA);
            });

            supertest(server.build())
                .get("/")
                .expect(200, "GET", function () {
                    expect(spyA.calledOnce).to.eqls(true);
                    expect(spyB.calledOnce).to.eqls(true);
                    expect(spyC.calledOnce).to.eqls(true);
                    expect(result).to.equal("abc");
                    done();
                });
        });

        it("should resolve controller-level middleware", () => {
            const symbolId = Symbol("spyA");
            const strId = "spyB";

            @injectable()
            @controller("/", symbolId, strId)
            class TestController {
                @httpGet("/") public getTest(req: express.Request, res: express.Response) { res.send("GET"); }
            }

            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");
            container.bind<express.RequestHandler>(symbolId).toConstantValue(spyA);
            container.bind<express.RequestHandler>(strId).toConstantValue(spyB);

            server = new InversifyExpressServer(container);

            let agent = supertest(server.build());

            return agent.get("/")
                .expect(200, "GET")
                .then(() => {
                    expect(spyA.calledOnce).to.eqls(true);
                    expect(spyB.calledOnce).to.eqls(true);
                    expect(result).to.equal("ab");
                });
        });

        it("should resolve method-level middleware", () => {
            const symbolId = Symbol("spyA");
            const strId = "spyB";

            @injectable()
            @controller("/")
            class TestController {
                @httpGet("/", symbolId, strId)
                public getTest(req: express.Request, res: express.Response) { res.send("GET"); }
            }

            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");
            container.bind<express.RequestHandler>(symbolId).toConstantValue(spyA);
            container.bind<express.RequestHandler>(strId).toConstantValue(spyB);

            server = new InversifyExpressServer(container);

            let agent = supertest(server.build());

            return agent.get("/")
                .expect(200, "GET")
                .then(() => {
                    expect(spyA.calledOnce).to.eqls(true);
                    expect(spyB.calledOnce).to.eqls(true);
                    expect(result).to.equal("ab");
                });
        });

        it("should compose controller- and method-level middleware", () => {
            const symbolId = Symbol("spyA");
            const strId = "spyB";

            @injectable()
            @controller("/", symbolId)
            class TestController {
                @httpGet("/", strId)
                public getTest(req: express.Request, res: express.Response) { res.send("GET"); }
            }

            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");
            container.bind<express.RequestHandler>(symbolId).toConstantValue(spyA);
            container.bind<express.RequestHandler>(strId).toConstantValue(spyB);

            server = new InversifyExpressServer(container);

            let agent = supertest(server.build());

            return agent.get("/")
                .expect(200, "GET")
                .then(() => {
                    expect(spyA.calledOnce).to.eqls(true);
                    expect(spyB.calledOnce).to.eqls(true);
                    expect(result).to.equal("ab");
                });
        });
    });
    describe("Parameters:", () => {
        it("should bind a method parameter to the url parameter of the web request", (done) => {
            @injectable()
            @controller("/")
            class TestController {
                // tslint:disable-next-line:max-line-length
                @httpGet(":id") public getTest(@requestParam("id") id: string, req: express.Request, res: express.Response) {
                    return id;
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/foo")
                .expect(200, "foo", done);
        });

        it("should bind a method parameter to the request object", (done) => {
            @injectable()
            @controller("/")
            class TestController {
                @httpGet(":id") public getTest(@request() req: express.Request) {
                    return req.params.id;
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/GET")
                .expect(200, "GET", done);
        });

        it("should bind a method parameter to the response object", (done) => {
            @injectable()
            @controller("/")
            class TestController {
                @httpGet("/") public getTest(@response() res: express.Response) {
                    return res.send("foo");
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .expect(200, "foo", done);
        });

        it("should bind a method parameter to a query parameter", (done) => {
            @injectable()
            @controller("/")
            class TestController {
                @httpGet("/") public getTest(@queryParam("id") id: string) {
                    return id;
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .query("id=foo")
                .expect(200, "foo", done);
        });

        it("should bind a method parameter to the request body", (done) => {
            @injectable()
            @controller("/")
            class TestController {
                @httpPost("/") public getTest(@requestBody() reqBody: string) {
                    return reqBody;
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            let body = {foo: "bar"};
            server.setConfig((app) => {
                app.use(bodyParser.json());
            });
            supertest(server.build())
                .post("/")
                .send(body)
                .expect(200, body, done);
        });

        it("should bind a method parameter to the request headers", (done) => {
            @injectable()
            @controller("/")
            class TestController {
                @httpGet("/") public getTest(@requestHeaders("testhead") headers: any) {
                    return headers;
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .set("TestHead", "foo")
                .expect(200, "foo", done);
        });

        it("should bind a method parameter to a cookie", (done) => {
            @injectable()
            @controller("/")
            class TestController {
                @httpGet("/") public getCookie(@cookies("cookie") cookie: any, req: express.Request, res: express.Response) {
                    if (cookie) {
                        res.send(cookie);
                    } else {
                        res.send(":(");
                    }
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            server.setConfig((app) => {
                app.use(cookieParser());
                app.use(function (req, res, nextFunc) {
                    res.cookie("cookie", "hey");
                    nextFunc();
                });
            });
            supertest(server.build())
                .get("/")
                .expect("set-cookie", "cookie=hey; Path=/", done);
        });

        it("should bind a method parameter to the next function", (done) => {
            @injectable()
            @controller("/")
            class TestController {
                @httpGet("/") public getTest(@next() nextFunc: any) {
                    let err = new Error("foo");
                    return nextFunc();
                }
                @httpGet("/") public getResult() {
                    return "foo";
                }
            }
            container.bind<interfaces.Controller>(TYPE.Controller).to(TestController).whenTargetNamed("TestController");

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .expect(200, "foo", done);
        });
    });

});
