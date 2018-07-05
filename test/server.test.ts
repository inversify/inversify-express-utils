import { expect } from "chai";
import * as sinon from "sinon";
import * as express from "express";
import { InversifyExpressServer } from "../src/server";
import { controller } from "../src/decorators";
import { Container, injectable } from "inversify";
import { TYPE } from "../src/constants";
import { cleanUpMetadata } from "../src/utils";
import { HttpResponseMessage } from "../src";
import { Mock, Times, MockBehavior } from "moq.ts";

describe("Unit Test: InversifyExpressServer", () => {

    beforeEach((done) => {
        cleanUpMetadata();
        done();
    });

    it("should call the configFn before the errorConfigFn", (done) => {

        let middleware = function(
            req: express.Request,
            res: express.Response,
            next: express.NextFunction
        ) {
            return;
        };

        let configFn = sinon.spy((app: express.Application) => {
            app.use(middleware);
        });

        let errorConfigFn = sinon.spy((app: express.Application) => {
            app.use(middleware);
        });

        let container = new Container();

        @controller("/")
        class TestController {}

        let server = new InversifyExpressServer(container);

        server.setConfig(configFn)
            .setErrorConfig(errorConfigFn);

        expect(configFn.called).to.eq(false);
        expect(errorConfigFn.called).to.eq(false);

        server.build();

        expect(configFn.calledOnce).to.eqls(true);
        expect(errorConfigFn.calledOnce).to.eqls(true);
        expect(configFn.calledBefore(errorConfigFn)).to.eqls(true);
        done();
    });

    it("Should allow to pass a custom Router instance as config", () => {

        let container = new Container();

        let customRouter = express.Router({
            caseSensitive: false,
            mergeParams: false,
            strict: false
        });

        let serverWithDefaultRouter = new InversifyExpressServer(container);
        let serverWithCustomRouter = new InversifyExpressServer(container, customRouter);

        expect((serverWithDefaultRouter as any)._router === customRouter).to.eq(false);
        expect((serverWithCustomRouter as any)._router === customRouter).to.eqls(true);

    });

    it("Should allow to provide custom routing configuration", () => {

        let container = new Container();

        let routingConfig = {
            rootPath: "/such/root/path"
        };

        let serverWithDefaultConfig = new InversifyExpressServer(container);
        let serverWithCustomConfig = new InversifyExpressServer(container, null, routingConfig);

        expect((serverWithCustomConfig as any)._routingConfig).to.eq(routingConfig);
        expect((serverWithDefaultConfig as any)._routingConfig).to.not.eql(
            (serverWithCustomConfig as any)._routingConfig
        );

    });

    it("Should allow to provide a custom express application", () => {
        let container = new Container();
        let app = express();
        let serverWithDefaultApp = new InversifyExpressServer(container);
        let serverWithCustomApp = new InversifyExpressServer(container, null, null, app);
        expect((serverWithCustomApp as any)._app).to.eq(app);
        expect((serverWithDefaultApp as any)._app).to.not.eql((serverWithCustomApp as any)._app);
    });

    it("Should handle a HttpResponseMessage that has no content", () => {
        let container = new Container();
        let server = new InversifyExpressServer(container);

        let httpResponseMessageWithoutContent = new HttpResponseMessage(404);
        let mockResponse = new Mock<express.Response>().setBehaviorStrategy(MockBehavior.Loose);

        (server as any).handleHttpResponseMessage(httpResponseMessageWithoutContent, mockResponse.object());

        mockResponse.verify(instance => instance.sendStatus(404), Times.Once());
    });
});
