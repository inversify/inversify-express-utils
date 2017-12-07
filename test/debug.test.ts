import { expect } from "chai";
import * as express from "express";
import { Container, injectable } from "inversify";
import * as prettyjson from "prettyjson";
import { METADATA_KEY, PARAMETER_TYPE, TYPE } from "../src/constants";
import { cleanUpMetadata } from "../src/utils";
import {
    interfaces,
    InversifyExpressServer,
    controller,
    httpMethod,
    httpGet,
    request,
    response,
    requestParam,
    queryParam,
    httpPost,
    httpDelete,
    getRouteInfo,
    BaseHttpController
} from "../src/index";

describe("Debug utils", () => {

    beforeEach((done) => {
        cleanUpMetadata();
        done();
    });

    it("should be able to get router info", () => {

        let container = new Container();

        @controller("/api/user")
        class UserController extends BaseHttpController {
            @httpGet("/")
            public get() {
                return {};
            }
            @httpPost("/")
            public post() {
                return {};
            }
            @httpDelete("/:id")
            public delete(@requestParam("id") id: string) {
                return {};
            }
        }

        @controller("/api/order")
        class OrderController extends BaseHttpController {
            @httpGet("/")
            public get() {
                return {};
            }
            @httpPost("/")
            public post() {
                return {};
            }
            @httpDelete("/:id")
            public delete(@requestParam("id") id: string) {
                return {};
            }
        }

        const TYPES = {
            OrderController: OrderController.name,
            UserController: UserController.name
        };

        let server = new InversifyExpressServer(container);
        let app = server.build();

        const routeInfo = getRouteInfo(container);

        console.log(
            prettyjson.render({ CONTROLLERS: routeInfo })
        );

        expect(routeInfo[0].controller).to.eq(TYPES.OrderController);
        expect(routeInfo[0].endpoints[0].route).to.eq("GET /api/order/");
        expect(routeInfo[0].endpoints[0].args).to.eq(undefined);
        expect(routeInfo[0].endpoints[1].route).to.eq("POST /api/order/");
        expect(routeInfo[0].endpoints[1].args).to.eq(undefined);
        expect(routeInfo[0].endpoints[2].route).to.eq("DELETE /api/order/:id");

        const arg1 = routeInfo[0].endpoints[2].args;
        if (arg1 !== undefined) {
            expect(arg1[0]).to.eq("@requestParam id");
        } else {
            expect(true).to.eq(false, "This line should never be executed!");
        }

        expect(routeInfo[1].controller).to.eq(TYPES.UserController);
        expect(routeInfo[1].endpoints[0].route).to.eq("GET /api/user/");
        expect(routeInfo[1].endpoints[1].args).to.eq(undefined);
        expect(routeInfo[1].endpoints[1].route).to.eq("POST /api/user/");
        expect(routeInfo[1].endpoints[1].args).to.eq(undefined);
        expect(routeInfo[1].endpoints[2].route).to.eq("DELETE /api/user/:id");

        const arg2 = routeInfo[1].endpoints[2].args;
        if (arg2 !== undefined) {
            expect(arg2[0]).to.eq("@requestParam id");
        } else {
            expect(true).to.eq(false, "This line should never be executed!");
        }

    });

    it("should be able to handle missig parameter metadata", () => {

        let container = new Container();

        @controller("/api/order")
        class OrderController extends BaseHttpController {
            @httpGet("/")
            public get() {
                return {};
            }
            @httpPost("/")
            public post() {
                return {};
            }
        }

        const TYPES = {
            OrderController: OrderController.name
        };

        let server = new InversifyExpressServer(container);
        let app = server.build();

        const routeInfo = getRouteInfo(container);

        console.log(
            prettyjson.render({ CONTROLLERS: routeInfo })
        );

        console.log(routeInfo);

        expect(routeInfo[0].controller).to.eq(TYPES.OrderController);
        expect(routeInfo[0].endpoints[0].route).to.eq("GET /api/order/");
        expect(routeInfo[0].endpoints[0].args).to.eq(undefined);
        expect(routeInfo[0].endpoints[1].route).to.eq("POST /api/order/");
        expect(routeInfo[0].endpoints[1].args).to.eq(undefined);

    });

});
