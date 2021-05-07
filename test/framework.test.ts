import "reflect-metadata";
import * as sinon from "sinon";
import * as supertest from "supertest";
import { expect } from "chai";
import * as inversify from "inversify";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import { injectable, Container } from "inversify";
import { interfaces, InversifyExpressServer } from "../src";
import {
    controller, httpMethod, all, httpGet, httpPost, httpPut, httpPatch,
    httpHead, httpDelete, request, response, requestParam,
    requestBody, queryParam, requestHeaders, cookies,
    next, principal
} from "../src/decorators";
import * as Bluebird from "bluebird";
import { cleanUpMetadata } from "../src/utils";
import { it, describe, beforeEach } from "mocha";

describe("Integration Tests:", () => {

    let server: InversifyExpressServer;
    let container: inversify.interfaces.Container;

    beforeEach((done) => {
        cleanUpMetadata();
        container = new Container();
        done();
    });

    describe("Routing & Request Handling:", () => {

        it("should work for async controller methods", (done) => {

            @controller("/")
            class TestController {
                @httpGet("/") public getTest(req: express.Request, res: express.Response) {
                    return new Promise(((resolve) => {
                        setTimeout(resolve, 100, "GET");
                    }));
                }
            }

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .expect(200, "GET", done);
        });

        it("should work for async controller methods that fails", (done) => {

            @controller("/")
            class TestController {
                @httpGet("/") public getTest(req: express.Request, res: express.Response) {
                    return new Promise(((resolve, reject) => {
                        setTimeout(reject, 100, "GET");
                    }));
                }
            }

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .expect(500, done);
        });

        it("should work for async controller methods using non-native Bluebird promise", (done) => {

            @controller("/")
            class TestController {
                @httpGet("/") public getTest(req: express.Request, res: express.Response) {
                    return new Bluebird(((resolve) => {
                        setTimeout(resolve, 100, "GET");
                    }));
                }
            }

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .expect(200, "GET", done);
        });

        it("should work for async controller methods, using non-native Bluebird promise, that fails", (done) => {

            @controller("/")
            class TestController {
                @httpGet("/") public getTest(req: express.Request, res: express.Response) {
                    return new Bluebird(((resolve, reject) => {
                        setTimeout(reject, 100, "GET");
                    }));
                }
            }

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .expect(500, done);
        });

        it("should work for methods which call nextFunc()", (done) => {

            @controller("/")
            class TestController {
                @httpGet("/") public getTest(req: express.Request, res: express.Response, nextFunc: express.NextFunction) {
                    nextFunc();
                }

                @httpGet("/") public getTest2(req: express.Request, res: express.Response) {
                    return "GET";
                }
            }

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .expect(200, "GET", done);
        });


        it("should work for async methods which call nextFunc()", (done) => {

            @controller("/")
            class TestController {
                @httpGet("/") public getTest(req: express.Request, res: express.Response, nextFunc: express.NextFunction) {
                    return new Promise(((resolve) => {
                        setTimeout(() => {
                            nextFunc();
                            resolve(null);
                        }, 100, "GET");
                    }));
                }

                @httpGet("/") public getTest2(req: express.Request, res: express.Response) {
                    return "GET";
                }
            }

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .expect(200, "GET", done);
        });


        it("should work for async methods called by nextFunc()", (done) => {

            @controller("/")
            class TestController {
                @httpGet("/") public getTest(req: express.Request, res: express.Response, nextFunc: express.NextFunction) {
                    return nextFunc;
                }

                @httpGet("/") public getTest2(req: express.Request, res: express.Response) {
                    return new Promise(((resolve) => {
                        setTimeout(resolve, 100, "GET");
                    }));
                }
            }

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .expect(200, "GET", done);
        });


        it("should work for each shortcut decorator", (done) => {

            @controller("/")
            class TestController {
                @httpGet("/") public getTest(req: express.Request, res: express.Response) { res.send("GET"); }
                @httpPost("/") public postTest(req: express.Request, res: express.Response) { res.send("POST"); }
                @httpPut("/") public putTest(req: express.Request, res: express.Response) { res.send("PUT"); }
                @httpPatch("/") public patchTest(req: express.Request, res: express.Response) { res.send("PATCH"); }
                @httpHead("/") public headTest(req: express.Request, res: express.Response) { res.send("HEAD"); }
                @httpDelete("/") public deleteTest(req: express.Request, res: express.Response) { res.send("DELETE"); }
            }

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

            @controller("/")
            class TestController {
                @httpMethod("propfind", "/") public getTest(req: express.Request, res: express.Response) { res.send("PROPFIND"); }
            }

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .propfind("/")
                .expect(200, "PROPFIND", done);
        });


        it("should use returned values as response", (done) => {
            let result = { "hello": "world" };

            @controller("/")
            class TestController {
                @httpGet("/") public getTest(req: express.Request, res: express.Response) { return result; }
            }

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .expect(200, JSON.stringify(result), done);
        });

        it("should use custom router passed from configuration", () => {
            @controller("/CaseSensitive")
            class TestController {
                @httpGet("/Endpoint") public get() {
                    return "Such Text";
                }
            }

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

            @controller("/ping")
            class TestController {
                @httpGet("/endpoint") public get() {
                    return "pong";
                }
            }

            server = new InversifyExpressServer(container, null, { rootPath: "/api/v1" });

            return supertest(server.build())
                .get("/api/v1/ping/endpoint")
                .expect(200, "pong");
        });

        it("should work for controller methods who's return value is falsey", (done) => {
            @controller("/user")
            class TestController {
                @httpDelete("/") public async delete(): Promise<void> {
                    return;
                }
            }

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .delete("/user")
                .expect(204, "", done);
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
            spyA.resetHistory();
            spyB.resetHistory();
            spyC.resetHistory();
            done();
        });

        it("should call method-level middleware correctly (GET)", (done) => {

            @controller("/")
            class TestController {
                @httpGet("/", spyA, spyB, spyC) public getTest(req: express.Request, res: express.Response) { res.send("GET"); }
            }

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

            @controller("/")
            class TestController {
                @httpPost("/", spyA, spyB, spyC) public postTest(req: express.Request, res: express.Response) { res.send("POST"); }
            }

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

            @controller("/")
            class TestController {
                @httpPut("/", spyA, spyB, spyC) public postTest(req: express.Request, res: express.Response) { res.send("PUT"); }
            }

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

            @controller("/")
            class TestController {
                @httpPatch("/", spyA, spyB, spyC) public postTest(req: express.Request, res: express.Response) { res.send("PATCH"); }
            }

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

            @controller("/")
            class TestController {
                @httpHead("/", spyA, spyB, spyC) public postTest(req: express.Request, res: express.Response) { res.send("HEAD"); }
            }

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

            @controller("/")
            class TestController {
                @httpDelete("/", spyA, spyB, spyC) public postTest(req: express.Request, res: express.Response) { res.send("DELETE"); }
            }

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

            @controller("/")
            class TestController {
                @all("/", spyA, spyB, spyC) public postTest(req: express.Request, res: express.Response) { res.send("ALL"); }
            }

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

            @controller("/", spyA, spyB, spyC)
            class TestController {
                @httpGet("/") public getTest(req: express.Request, res: express.Response) { res.send("GET"); }
            }

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

            @controller("/")
            class TestController {
                @httpGet("/") public getTest(req: express.Request, res: express.Response) { res.send("GET"); }
            }

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

            @controller("/", spyB)
            class TestController {
                @httpGet("/", spyC) public getTest(req: express.Request, res: express.Response) { res.send("GET"); }
            }

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

            const symbolId = Symbol.for("spyA");
            const strId = "spyB";

            @controller("/", symbolId, strId)
            class TestController {
                @httpGet("/") public getTest(req: express.Request, res: express.Response) { res.send("GET"); }
            }

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
            const symbolId = Symbol.for("spyA");
            const strId = "spyB";

            @controller("/")
            class TestController {
                @httpGet("/", symbolId, strId)
                public getTest(req: express.Request, res: express.Response) { res.send("GET"); }
            }

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

            const symbolId = Symbol.for("spyA");
            const strId = "spyB";

            @controller("/", symbolId)
            class TestController {
                @httpGet("/", strId)
                public getTest(req: express.Request, res: express.Response) { res.send("GET"); }
            }

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

            @controller("/")
            class TestController {
                // tslint:disable-next-line:max-line-length
                @httpGet(":id") public getTest(@requestParam("id") id: string, req: express.Request, res: express.Response) {
                    return id;
                }
            }

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/foo")
                .expect(200, "foo", done);
        });

        it("should bind a method parameter to the request object", (done) => {

            @controller("/")
            class TestController {
                @httpGet(":id") public getTest(@request() req: express.Request) {
                    return req.params["id"];
                }
            }

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/GET")
                .expect(200, "GET", done);
        });

        it("should bind a method parameter to the response object", (done) => {

            @controller("/")
            class TestController {
                @httpGet("/") public getTest(@response() res: express.Response) {
                    return res.send("foo");
                }
            }

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .expect(200, "foo", done);
        });

        it("should bind a method parameter to a query parameter", (done) => {

            @controller("/")
            class TestController {
                @httpGet("/") public getTest(@queryParam("id") id: string) {
                    return id;
                }
            }

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .query("id=foo")
                .expect(200, "foo", done);
        });

        it("should bind a method parameter to the request body", (done) => {

            @controller("/")
            class TestController {
                @httpPost("/") public getTest(@requestBody() reqBody: string) {
                    return reqBody;
                }
            }

            server = new InversifyExpressServer(container);
            let body = { foo: "bar" };
            server.setConfig((app) => {
                app.use(bodyParser.json());
            });
            supertest(server.build())
                .post("/")
                .send(body)
                .expect(200, body, done);
        });

        it("should bind a method parameter to the request headers", (done) => {

            @controller("/")
            class TestController {
                @httpGet("/") public getTest(@requestHeaders("testhead") headers: any) {
                    return headers;
                }
            }

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .set("TestHead", "foo")
                .expect(200, "foo", done);
        });

        it("should be case insensitive to request headers", (done) => {

            @controller("/")
            class TestController {
                @httpGet("/") public getTest(@requestHeaders("TestHead") headers: any) {
                    return headers;
                }
            }

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .set("TestHead", "foo")
                .expect(200, "foo", done);
        });

        it("should bind a method parameter to a cookie", (done) => {

            @controller("/")
            class TestController {
                @httpGet("/") public getCookie(@cookies("Cookie") cookie: any, req: express.Request, res: express.Response) {
                    return cookie;
                }
            }

            server = new InversifyExpressServer(container);
            server.setConfig((app) => {
                app.use(cookieParser());
            });
            supertest(server.build())
                .get("/")
                .set("Cookie", "Cookie=hey")
                .expect(200, "hey", done);
        });

        it("should bind a method parameter to the next function", (done) => {

            @controller("/")
            class TestController {
                @httpGet("/") public getTest(@next() nextFunc: any) {
                    return nextFunc();
                }
                @httpGet("/") public getResult() {
                    return "foo";
                }
            }

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .expect(200, "foo", done);
        });

        it("should bind a method parameter to a principal with null (empty) details when no AuthProvider is set.", (done) => {

            @controller("/")
            class TestController {
                @httpGet("/") public getPrincipalTest(@principal() userPrincipal: interfaces.Principal) {
                    return userPrincipal.details;
                }
            }

            server = new InversifyExpressServer(container);
            supertest(server.build())
                .get("/")
                .expect(200, "", done);
        });

        it("should bind a method parameter to a principal with valid details when an AuthProvider is set.", (done) => {

            @controller("/")
            class TestController {
                @httpGet("/") public async getPrincipalTest(@principal() userPrincipal: interfaces.Principal) {
                    return await userPrincipal.details;
                }
            }

            @injectable()
            class CustomAuthProvider implements interfaces.AuthProvider {
                public async getUser(
                    req: express.Request,
                    res: express.Response,
                    nextFunc: express.NextFunction
                ): Promise<interfaces.Principal> {
                    return Promise.resolve({
                        details: "something",
                        isAuthenticated: () => Promise.resolve(true),
                        isResourceOwner: () => Promise.resolve(true),
                        isInRole: () => Promise.resolve(true)
                    } as interfaces.Principal);
                }
            }

            server = new InversifyExpressServer(container, null, null, null, CustomAuthProvider);
            supertest(server.build())
                .get("/")
                .expect(200, "something", done);
        });

    });

});
