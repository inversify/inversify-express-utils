// test libraries
import { expect } from "chai";
import * as sinon from "sinon";

// dependencies
import * as express from "express";
import { InversifyExpressServer } from "../src/server";

describe("Unit Test: InversifyExpressServer", () => {

    it("should not call the server config function until after a call to build()", (done) => {
        let middleware = function(req: express.Request, res: express.Response, next: express.NextFunction) { return; };
        let fn = sinon.spy((app: express.Application) => { app.use(middleware); });
        let server = new InversifyExpressServer(null);

        server.setConfig(fn);
        expect(fn.calledOnce).to.be.false;
        server.build();
        expect(fn.calledOnce).to.be.true;
        done();
    });

    it("should use the routes provided to register server routes", (done) => {
        done();
    });
});
