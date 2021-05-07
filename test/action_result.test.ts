import * as results from "../src/results";
import { expect } from "chai";
import * as httpStatusCodes from "http-status-codes";
import { HttpResponseMessage } from "../src/httpResponseMessage";

describe("ActionResults", function () {
    describe("OkResult", function () {
        it("should respond with an HTTP 200", async function () {
            const actionResult = new results.OkResult();
            const responseMessage = await actionResult.executeAsync();
            expect(responseMessage.statusCode).to.eq(httpStatusCodes.OK);
        });
    });

    describe("OkNegotiatedContentResult", function () {
        it("should respond with an HTTP 200 with content", async function () {
            const content = {
                foo: "bar"
            };
            const actionResult = new results.OkNegotiatedContentResult(content);
            const responseMessage = await actionResult.executeAsync();
            expect(responseMessage.statusCode).to.eq(httpStatusCodes.OK);
            expect(await responseMessage.content.readAsStringAsync()).to.eq(JSON.stringify(content));
        });
    });

    describe("BadRequestResult", function () {
        it("should respond with an HTTP 400", async function () {
            const actionResult = new results.BadRequestResult();
            const responseMessage = await actionResult.executeAsync();
            expect(responseMessage.statusCode).to.eq(httpStatusCodes.BAD_REQUEST);
        });
    });

    describe("BadRequestErrorMessageResult", function () {
        it("should respond with an HTTP 400 and an error message", async function () {
            const message = "uh oh!";
            const actionResult = new results.BadRequestErrorMessageResult(message);
            const responseMessage = await actionResult.executeAsync();
            expect(responseMessage.statusCode).to.eq(httpStatusCodes.BAD_REQUEST);
            expect(await responseMessage.content.readAsStringAsync()).to.eq(message);
        });
    });

    describe("ConflictResult", function () {
        it("should respond with an HTTP 409", async function () {
            const actionResult = new results.ConflictResult();
            const responseMessage = await actionResult.executeAsync();
            expect(responseMessage.statusCode).to.eq(httpStatusCodes.CONFLICT);
        });
    });

    describe("CreatedNegotiatedContentResult", function () {
        it("should respond with an HTTP 302 and appropriate headers", async function () {
            const uri = "http://foo/bar";
            const content = {
                foo: "bar"
            };
            const actionResult = new results.CreatedNegotiatedContentResult(uri, content);
            const responseMessage = await actionResult.executeAsync();
            expect(responseMessage.statusCode).to.eq(httpStatusCodes.CREATED);
            expect(await responseMessage.content.readAsStringAsync()).to.eq(JSON.stringify(content));
            expect(responseMessage.headers["location"]).to.eq(uri);
        });
    });

    describe("ExceptionResult", function () {
        it("should respond with an HTTP 500 and the error message", async function () {
            const error = new Error("foo");
            const actionResult = new results.ExceptionResult(error);
            const responseMessage = await actionResult.executeAsync();
            expect(responseMessage.statusCode).to.eq(httpStatusCodes.INTERNAL_SERVER_ERROR);
            expect(await responseMessage.content.readAsStringAsync()).to.eq("Error: foo");
        });
    });

    describe("InternalServerErrorResult", function () {
        it("should respond with an HTTP 500", async function () {
            const actionResult = new results.InternalServerErrorResult();
            const responseMessage = await actionResult.executeAsync();
            expect(responseMessage.statusCode).to.eq(httpStatusCodes.INTERNAL_SERVER_ERROR);
        });
    });

    describe("NotFoundResult", function () {
        it("should respond with an HTTP 404", async function () {
            const actionResult = new results.NotFoundResult();
            const responseMessage = await actionResult.executeAsync();
            expect(responseMessage.statusCode).to.eq(httpStatusCodes.NOT_FOUND);
        });
    });

    describe("RedirectResult", function () {
        it("should respond with an HTTP 302", async function () {
            const uri = "http://foo/bar";
            const actionResult = new results.RedirectResult(uri);
            const responseMessage = await actionResult.executeAsync();
            expect(responseMessage.statusCode).to.eq(httpStatusCodes.MOVED_TEMPORARILY);
            expect(responseMessage.headers["location"]).to.eq(uri);
        });
    });

    describe("ResponseMessageResult", function () {
        it("should respond with an HTTP 302", async function () {
            const responseMessage = new HttpResponseMessage(200);
            const actionResult = new results.ResponseMessageResult(responseMessage);

            expect(await actionResult.executeAsync()).to.eq(responseMessage);
        });
    });

    describe("StatusCodeResult", function () {
        it("should respond with the specified status code", async function () {
            const actionResult = new results.StatusCodeResult(417);
            const responseMessage = await actionResult.executeAsync();
            expect(responseMessage.statusCode).to.eq(417);
        });
    });
});
