import { expect } from "chai";
import * as express from "express";
import { Controller, Method, Get, Request, Response, RequestParam, QueryParam } from "../src/decorators";
import { interfaces } from "../src/interfaces";
import { METADATA_KEY, PARAMETER_TYPE } from "../src/constants";
import { InversifyExpressServer } from "../src/server";
import { Container, injectable } from "inversify";
import { TYPE } from "../src/constants";
import * as request from "supertest";

describe("Unit Test: Previous bugs", () => {

    it("should support multiple controller methods with param annotations", (done) => {

        let container = new Container();

        @injectable()
        @Controller("/api/test")
        class TestController {
            @Get("/")
            public get(
                @Request() req: express.Request,
                @Response() res: express.Response
            ) {
                expect(req.url).not.to.eql(undefined);
                expect((req as any).setHeader).to.eql(undefined);
                expect(res.setHeader).not.to.eql(undefined);
                expect((res as any).url).to.eql(undefined);
                res.json([{ id: 1 }, { id: 2 }]);
            }
            @Get("/:id")
            public getById(
                @RequestParam("id") id: string,
                @Request() req: express.Request,
                @Response() res: express.Response
            ) {
                expect(id).to.eql("5");
                expect(req.url).not.to.eql(undefined);
                expect((req as any).setHeader).to.eql(undefined);
                expect(res.setHeader).not.to.eql(undefined);
                expect((res as any).url).to.eql(undefined);
                res.json({ id: id });
            }
        }

        container.bind(TYPE.Controller).to(TestController);
        let server = new InversifyExpressServer(container);
        let app = server.build();

        request(app).get("/api/test/")
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .then(response1 => {
                        expect(Array.isArray(response1.body)).to.eql(true);
                        expect(response1.body[0].id).to.eql("1");
                        expect(response1.body[0].id).to.eql("2");
                    });

        request(app).get("/api/test/5")
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .then(response2 => {
                        expect(Array.isArray(response2.body)).to.eql(false);
                        expect(response2.body.id).to.eql("5");
                        done();
                    });

    });
         it("should support empty query params", (done) => {
        let container = new Container();

        @injectable()
        @Controller("/api/test")
        class TestController {
            @Get("/")
            public get(
                @Request() req: express.Request,
                @Response() res: express.Response,
                @QueryParam("empty") empty: string,
                @QueryParam("test") test: string
            ) {
                return {empty: empty, test: test};
            }

        }

        container.bind(TYPE.Controller).to(TestController);
        let server = new InversifyExpressServer(container);
        let app = server.build();

        request(app).get("/api/test?test=testquery")
                    .expect("Content-Type", /json/)
                    .expect(200)
                    .then(response1 => {
                        expect(response1.body.test).to.eql("testquery");
                        expect(response1.body.empty).to.be.undefined;
                        done();
                    });

    });

});
