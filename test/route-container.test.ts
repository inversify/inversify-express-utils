// test libraries
import * as express from "express";
import { expect } from "chai";

// dependencies
import { RouteContainer } from "../src/route-container";

describe("Unit Test: RouteContainer", () => {

    beforeEach((done) => {
        // reset route container
        RouteContainer.setInstance(undefined);
        done();
    });

    it("should be a singleton", (done) => {
        let instanceA = RouteContainer.getInstance();
        let instanceB = RouteContainer.getInstance();

        expect(instanceA).eql(instanceB);
        done();
    });

    it("should create a route for each registered controller", (done) => {
        let container = RouteContainer.getInstance();
        let targetA = {constructor: "A", test: "test"};
        let targetB = {constructor: "B", test: "test"};
        let targetC = {constructor: "C", test: "test"};

        container.registerHandler("get", "/", [], targetA, "test");
        container.registerController("/A", [],  "A");
        container.registerHandler("get", "/", [], targetB, "test");
        container.registerController("/B", [], "B");
        container.registerHandler("get", "/", [], targetC, "test");
        container.registerController("/C", [], "C");

        expect(container.getRoutes().length).eql(3);
        done();
    });

    it("should set middleware, path, and router for a registered controller", (done) => {
        let container = RouteContainer.getInstance();
        let target = {constructor: "test", test: "test"};
        let middleware: express.RequestHandler[] = [function m() { console.log("test"); }];

        container.registerHandler("get", "/", [], target, "test");
        container.registerController("/test", middleware,  "test");

        expect(container.getRoutes().length).eql(1);
        expect(container.getRoutes()[0].middleware).eql(middleware);
        expect(container.getRoutes()[0].path).eql("/test");
        expect(container.getRoutes()[0].router).not.to.be.undefined;
        done();
    });

    it("should not create a route for a controller with no handlers", (done) => {
       let container = RouteContainer.getInstance();

       container.registerController("/", [], "test");
       expect(container.getRoutes().length).eql(0);
       done();
    });
});
