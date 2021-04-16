import { expect } from "chai";
import * as express from "express";
import { interfaces } from "../../src/interfaces";
import * as bodyParser from "body-parser";
import { METADATA_KEY, PARAMETER_TYPE } from "../../src/constants";
import { InversifyExpressServer } from "../../src/server";
import { Container, injectable } from "inversify";
import { TYPE } from "../../src/constants";
import * as supertest from "supertest";
import {
    controller, httpMethod, httpGet, request,
    response, requestParam, queryParam, requestHeaders,
    httpDelete, httpPost, httpPut, httpOptions, requestBody
} from "../../src/decorators";
import { cleanUpMetadata } from "../../src/utils";

function getDemoServer() {

    interface Movie {
        name: string;
    }

    let container = new Container();

    @injectable()
    class GenericController<T> {

        @httpGet("/")
        public get() {
            return { status: "BASE GET!" };
        }

        @httpGet("/:id")
        public getById(
            @requestParam("id") id: string
        ) {
            return { status: `BASE GET BY ID! ${id}` };
        }

        @httpPost("/")
        public post(
            @requestBody() body: T,
        ) {
            return {
                status: `BASE POST!`,
                args: body
            };
        }

        @httpPut("/:id")
        public put(
            @requestBody() body: T,
            @requestParam("id") id: string
        ) {
            return {
                status: `BASE PUT! ${id}`,
                args: body
            };
        }

        @httpDelete("/:id")
        public delete(
            @requestParam("id") id: string
        ) {
            return { status: `BASE DELETE! ${id}` };
        }

        @httpOptions("/:id")
        public options(
            @requestParam("id") id: string
        ) {
            return { status: `BASE OPTIONS! ${id}` };
        }

    }

    @controller("/api/v1/movies")
    class MoviesController extends GenericController<Movie> {

        @httpDelete("/:movieId/actors/:actorId")
        public deleteActor(
            @requestParam("movieId") movieId: string,
            @requestParam("actorId") actorId: string
        ) {
            return { status: `DERIVED DELETE ACTOR! ${movieId} ${actorId}` };
        }

    }

    let app = new InversifyExpressServer(container);

    app.setConfig((a) => {
        a.use(bodyParser.json());
        a.use(bodyParser.urlencoded({ extended: true }));
    });

    let server = app.build();

    return server;

}

describe("Derived controller", () => {

    beforeEach((done) => {
        cleanUpMetadata();
        done();
    });

    it("Can access methods decorated with @httpGet from parent", (done) => {

        const server = getDemoServer();

        supertest(server).get("/api/v1/movies")
            .expect(200)
            .then(res => {
                expect(res.body.status).to.eql("BASE GET!");
                done();
            });

    });

    it("Can access methods decorated with @httpGet from parent", (done) => {

        const server = getDemoServer();
        const id = 5;

        supertest(server).get(`/api/v1/movies/${id}`)
            .expect(200)
            .then(res => {
                expect(res.body.status).to.eql(`BASE GET BY ID! ${id}`);
                done();
            });

    });

    it("Can access methods decorated with @httpPost from parent", (done) => {

        const server = getDemoServer();
        const movie = { name: "The Shining" };
        const status = `BASE POST!`;

        supertest(server).post(`/api/v1/movies`)
            .send(movie)
            .set("Content-Type", "application/json")
            .set("Accept", "application/json")
            .expect(200)
            .then(res => {
                expect(res.body.status).to.eql(status);
                expect(res.body.args).to.eql(movie);
                done();
            });

    });

    it("Can access methods decorated with @httpPut from parent", (done) => {

        const server = getDemoServer();
        const id = 5;
        const movie = { name: "The Shining" };

        supertest(server).put(`/api/v1/movies/${id}`)
            .send(movie)
            .set("Content-Type", "application/json")
            .set("Accept", "application/json")
            .expect(200)
            .then(res => {
                expect(res.body.status).to.eql(`BASE PUT! ${id}`);
                expect(res.body.args).to.eql(movie);
                done();
            });

    });

    it("Can access methods decorated with @httpDelete from parent", (done) => {

        const server = getDemoServer();
        const id = 5;

        supertest(server).delete(`/api/v1/movies/${id}`)
            .expect(200)
            .then(res => {
                expect(res.body.status).to.eql(`BASE DELETE! ${id}`);
                done();
            });

    });

    it("Can access methods decorated with @httpOptions from parent", (done) => {

        const server = getDemoServer();
        const id = 5;

        supertest(server).options(`/api/v1/movies/${id}`)
            .expect(200)
            .then(res => {
                expect(res.body.status).to.eql(`BASE OPTIONS! ${id}`);
                done();
            });

    });

    it("Derived controller can have its own methods", (done) => {

        const server = getDemoServer();
        const movieId = 5;
        const actorId = 3;

        supertest(server).delete(`/api/v1/movies/${movieId}/actors/${actorId}`)
            .expect(200)
            .then(res => {
                expect(res.body.status).to.eql(`DERIVED DELETE ACTOR! ${movieId} ${actorId}`);
                done();
            });

    });

});
