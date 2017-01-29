// test libraries
import { expect } from "chai";
import * as sinon from "sinon";

// dependencies
import * as express from "express";
import { InversifyExpressServer } from "../src/server";
import { Container, injectable } from "inversify";
import { TYPE } from "../src/constants";

describe("Unit Test: InversifyExpressServer", () => {

    it("should call the configFn before the errorConfigFn", (done) => {
        let middleware = function(req: express.Request, res: express.Response, next: express.NextFunction) { return; };
        let configFn = sinon.spy((app: express.Application) => { app.use(middleware); });
        let errorConfigFn = sinon.spy((app: express.Application) => { app.use(middleware); });
        let container = new Container();

        @injectable()
        class TestController {}

        container.bind(TYPE.Controller).to(TestController);
        let server = new InversifyExpressServer(container);

        server.setConfig(configFn)
            .setErrorConfig(errorConfigFn);

        expect(configFn.called).to.be.false;
        expect(errorConfigFn.called).to.be.false;

        server.build();

        expect(configFn.calledOnce).to.be.true;
        expect(errorConfigFn.calledOnce).to.be.true;
        expect(configFn.calledBefore(errorConfigFn)).to.be.true;
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

        expect((serverWithDefaultRouter as any)._router === customRouter).to.be.false;
        expect((serverWithCustomRouter as any)._router === customRouter).to.be.true;

    });

});
