import * as express from "express";
import { expect } from "chai";
import { interfaces } from "../../src/interfaces";
import { METADATA_KEY } from "../../src/constants";
import * as supertest from "supertest";
import {
    controller, httpGet, httpMethod, httpPut, withMiddleware
} from "../../src/decorators";
import { cleanUpMetadata } from "../../src/utils";
import { Container } from "inversify";
import { BaseMiddleware, InversifyExpressServer } from "../../src";

function cleanUpMidDecTestControllerMetadata() {
    class MidDecTestController { }
    Reflect.defineMetadata(METADATA_KEY.middleware, {}, MidDecTestController.constructor);
}

describe("Unit Test: @middleware decorator", () => {

    beforeEach((done) => {
        cleanUpMetadata();
        cleanUpMidDecTestControllerMetadata();
        done();
    });

    it("should add method metadata to a class when a handler is decorated with @withMiddleware", (done) => {
        const functionMiddleware = () => { return; };
        const identifierMiddleware = Symbol.for("foo");
        const path = "foo";
        const method = "get";

        class MidDecTestController {
            @httpMethod(method, path)
            @withMiddleware(functionMiddleware)
            public test() { return; }

            @httpMethod(method, path)
            @withMiddleware(functionMiddleware, identifierMiddleware)
            public test2() { return; }
        }

        const methodMetadata: interfaces.ControllerMethodMetadata[] = Reflect.getMetadata(
            METADATA_KEY.controllerMethod,
            MidDecTestController
        );

        const [ testMetaData, test2MetaData ] = methodMetadata;
        expect(testMetaData.middleware.length).equal(1);
        expect(test2MetaData.middleware.length).equal(2);
        expect(testMetaData.middleware).eql([functionMiddleware]);
        expect(test2MetaData.middleware).eql([functionMiddleware, identifierMiddleware]);
        done();
    });

    it("should add class metadata to a controller class when decorated with @withMiddleware", (done) => {
        const identifierMiddleware = Symbol.for("foo");
        const functionMiddleware = () => { return; };

        @controller("/foo")
        @withMiddleware(identifierMiddleware, functionMiddleware)
        class MidDecTestController { }

        const controllerMetaData: interfaces.ControllerMetadata = Reflect.getMetadata(
            METADATA_KEY.controller,
            MidDecTestController
        );

        expect(controllerMetaData.middleware.length).equal(2);
        expect(controllerMetaData.middleware).eql([identifierMiddleware, functionMiddleware]);
        done();
    });

    it("should be able to add middleware from multiple decorations", (done) => {
        const identifierMiddleware = Symbol.for("foo");
        const functionMiddleware = () => { return; };

        const first = withMiddleware(identifierMiddleware);
        const second = withMiddleware(functionMiddleware);

        @controller("/foo")
        @first
        @second
        class MidDecTestController { }

        const controllerMetaData: interfaces.ControllerMetadata = Reflect.getMetadata(
            METADATA_KEY.controller,
            MidDecTestController
        );

        expect(controllerMetaData.middleware.length).equal(2);
        expect(controllerMetaData.middleware).eql([functionMiddleware, identifierMiddleware]);
        done();
    });

    it("should process all requests when decorating a controller", (done) => {
        const addTestHeader = withMiddleware(
            (req: express.Request, res: express.Response, next: express.NextFunction) => {
                res.set("test-header", "foo");
                next();
            }
        );

        @controller("/foo")
        @addTestHeader
        class MidDecTestController {
            @httpGet("/bar")
            public get() {
                return { data: "hello" };
            }

            @httpPut("/baz")
            public put() {
                return { data: "there" };
            }
        }

        const container = new Container();
        container.bind<MidDecTestController>("MidDecTestController").to(MidDecTestController);
        const server = new InversifyExpressServer(container);

        const app = server.build();
        supertest(app)
            .get("/foo/bar")
            .end((req, res) => {
                expect(res.header["test-header"]).equal("foo");
            });

        supertest(app)
            .put("/foo/baz")
            .end((req, res) => {
                expect(res.header["test-header"]).equal("foo");
                done();
            });
    });
    it("should process only specific requests when decorating a handler", (done) => {
        const addTestHeader = withMiddleware(
            (req: express.Request, res: express.Response, next: express.NextFunction) => {
                res.set("test-header", "foo");
                next();
            }
        );

        @controller("/foo")
        class MidDecTestController {
            @httpGet("/bar")
            public get() {
                return { data: "hello" };
            }

            @httpPut("/baz")
            @addTestHeader
            public put() {
                return { data: "there" };
            }
        }

        const container = new Container();
        container.bind<MidDecTestController>("MidDecTestController").to(MidDecTestController);
        const server = new InversifyExpressServer(container);

        const app = server.build();
        supertest(app)
            .get("/foo/bar")
            .end((req, res) => {
                expect(res.header["test-header"]).equal(undefined);
            });

        supertest(app)
            .put("/foo/baz")
            .end((req, res) => {
                expect(res.header["test-header"]).equal("foo");
                done();
            });
    });
    it("should process requests with both controller- and handler middleware", (done) => {
        const addHandlerHeader = withMiddleware(
            (req: express.Request, res: express.Response, next: express.NextFunction) => {
                res.set("test-handler", "hello there!");
                next();
            }
        );
        const addControllerHeader = withMiddleware(
            (req: express.Request, res: express.Response, next: express.NextFunction) => {
                res.set("test-controller", "general kenobi");
                next();
            }
        );

        @controller("/foo")
        @addControllerHeader
        class MidDecTestController {
            @httpGet("/bar")
            public get() {
                return { data: "hello" };
            }

            @httpPut("/baz")
            @addHandlerHeader
            public put() {
                return { data: "there" };
            }
        }

        const container = new Container();
        container.bind<MidDecTestController>("MidDecTestController").to(MidDecTestController);
        const server = new InversifyExpressServer(container);

        const app = server.build();
        supertest(app)
            .get("/foo/bar")
            .end((req, res) => {
                expect(res.header["test-controller"]).equal("general kenobi");
                expect(res.header["test-handler"]).equal(undefined);
            });

        supertest(app)
            .put("/foo/baz")
            .end((req, res) => {
                expect(res.header["test-controller"]).equal("general kenobi");
                expect(res.header["test-handler"]).equal("hello there!");
                done();
            });
    });
    it("should be able to inject BaseMiddleware services by identifier", (done) => {
        const container = new Container();
        class MidDecTestMiddleware extends BaseMiddleware {
            public handler(req: express.Request, res: express.Response, next: express.NextFunction) {
                res.set("test-base-middleware", "working");
                next();
            }
        }
        container.bind<MidDecTestMiddleware>("TestMiddleware").to(MidDecTestMiddleware);

        @controller("/foo")
        @withMiddleware("TestMiddleware")
        class MidDecTestController {
            @httpGet("/bar")
            public get() {
                return { data: "hello" };
            }
        }
        container.bind<MidDecTestController>("MidDecTestController").to(MidDecTestController);

        const server = new InversifyExpressServer(container);
        const app = server.build();
        supertest(app)
            .get("/foo/bar")
            .end((req, res) => {
                expect(res.header["test-base-middleware"]).equal("working");
                done();
            });
    });
});
