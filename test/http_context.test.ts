import { expect } from "chai";
import * as express from "express";
import { Container, injectable, inject } from "inversify";
import * as supertest from "supertest";
import {
    InversifyExpressServer,
    TYPE,
    controller,
    httpGet,
    BaseHttpController,
    interfaces,
    httpContext
} from "../src/index";
import { cleanUpMetadata } from "../src/utils";

describe("HttpContex", () => {

    beforeEach((done) => {
        cleanUpMetadata();
        done();
    });

    it("Should be able to httpContext manually with the @httpContext decorator", (done) => {

        interface SomeDependency {
            name: string;
        }

        @controller("/")
        class TestController {

            @httpContext private readonly _httpContext: interfaces.HttpContext;
            @inject("SomeDependency") private readonly _someDependency: SomeDependency;

            @httpGet("/")
            public async getTest() {
                const headerVal = this._httpContext.request.headers["x-custom"];
                const name = this._someDependency.name;
                const isAuthenticated = await this._httpContext.user.isAuthenticated();
                expect(isAuthenticated).eq(false);
                return `${headerVal} & ${name}`;
            }
        }

        const container = new Container();

        container.bind<SomeDependency>("SomeDependency")
                .toConstantValue({ name: "SomeDependency!" });

        const server = new InversifyExpressServer(container);

        supertest(server.build())
            .get("/")
            .set("x-custom", "test-header!")
            .expect(200, `test-header! & SomeDependency!`, done);

    });

});
