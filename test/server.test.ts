// test libraries
import { expect } from "chai";
import * as sinon from "sinon";

// dependencies
import * as express from "express";
import { InversifyExpressServer } from "../src/server";
import { Kernel, injectable } from "inversify";

describe("Unit Test: InversifyExpressServer", () => {

    it("should call the configFn before the errorConfigFn", (done) => {
        let middleware = function(req: express.Request, res: express.Response, next: express.NextFunction) { return; };
        let configFn = sinon.spy((app: express.Application) => { app.use(middleware); });
        let errorConfigFn = sinon.spy((app: express.Application) => { app.use(middleware); });
        let kernel = new Kernel();

        @injectable()
        class TestController {}

        kernel.bind("Controller").to(TestController);
        let server = new InversifyExpressServer(kernel);

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
});
