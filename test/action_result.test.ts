import {expect} from 'chai';
import * as httpStatusCodes from 'http-status-codes';
import * as results from '../src/results';
import {HttpResponseMessage} from '../src/httpResponseMessage';

describe('ActionResults', () => {
    describe('OkResult', () => {
        it('should respond with an HTTP 200', async () => {
            const actionResult = new results.OkResult();
            const responseMessage = await actionResult.executeAsync();
            expect(responseMessage.statusCode).to.eq(httpStatusCodes.OK);
        });
    });

    describe('OkNegotiatedContentResult', () => {
        it('should respond with an HTTP 200 with content', async () => {
            const content = {
                foo: 'bar',
            };
            const actionResult = new results.OkNegotiatedContentResult(content);
            const responseMessage = await actionResult.executeAsync();
            expect(responseMessage.statusCode).to.eq(httpStatusCodes.OK);
            expect(
                await responseMessage.content.readAsStringAsync(),
            ).to.eq(JSON.stringify(content));
        });
    });

    describe('BadRequestResult', () => {
        it('should respond with an HTTP 400', async () => {
            const actionResult = new results.BadRequestResult();
            const responseMessage = await actionResult.executeAsync();
            expect(responseMessage.statusCode).to.eq(httpStatusCodes.BAD_REQUEST);
        });
    });

    describe('BadRequestErrorMessageResult', () => {
        it('should respond with an HTTP 400 and an error message', async () => {
            const message = 'uh oh!';
            const actionResult = new results.BadRequestErrorMessageResult(message);
            const responseMessage = await actionResult.executeAsync();
            expect(responseMessage.statusCode).to.eq(httpStatusCodes.BAD_REQUEST);
            expect(await responseMessage.content.readAsStringAsync()).to.eq(message);
        });
    });

    describe('ConflictResult', () => {
        it('should respond with an HTTP 409', async () => {
            const actionResult = new results.ConflictResult();
            const responseMessage = await actionResult.executeAsync();
            expect(responseMessage.statusCode).to.eq(httpStatusCodes.CONFLICT);
        });
    });

    describe('CreatedNegotiatedContentResult', () => {
        it('should respond with an HTTP 302 and appropriate headers', async () => {
            const uri = 'http://foo/bar';
            const content = {
                foo: 'bar',
            };
            const actionResult = new results.CreatedNegotiatedContentResult(uri, content);
            const responseMessage = await actionResult.executeAsync();
            expect(responseMessage.statusCode).to.eq(httpStatusCodes.CREATED);
            expect(
                await responseMessage.content.readAsStringAsync(),
            ).to.eq(JSON.stringify(content));
            expect(responseMessage.headers['location']).to.eq(uri);
        });
    });

    describe('ExceptionResult', () => {
        it('should respond with an HTTP 500 and the error message', async () => {
            const error = new Error('foo');
            const actionResult = new results.ExceptionResult(error);
            const responseMessage = await actionResult.executeAsync();
            expect(responseMessage.statusCode).to.eq(httpStatusCodes.INTERNAL_SERVER_ERROR);
            expect(await responseMessage.content.readAsStringAsync()).to.eq('Error: foo');
        });
    });

    describe('InternalServerErrorResult', () => {
        it('should respond with an HTTP 500', async () => {
            const actionResult = new results.InternalServerErrorResult();
            const responseMessage = await actionResult.executeAsync();
            expect(responseMessage.statusCode).to.eq(httpStatusCodes.INTERNAL_SERVER_ERROR);
        });
    });

    describe('NotFoundResult', () => {
        it('should respond with an HTTP 404', async () => {
            const actionResult = new results.NotFoundResult();
            const responseMessage = await actionResult.executeAsync();
            expect(responseMessage.statusCode).to.eq(httpStatusCodes.NOT_FOUND);
        });
    });

    describe('RedirectResult', () => {
        it('should respond with an HTTP 302', async () => {
            const uri = 'http://foo/bar';
            const actionResult = new results.RedirectResult(uri);
            const responseMessage = await actionResult.executeAsync();
            expect(responseMessage.statusCode).to.eq(httpStatusCodes.MOVED_TEMPORARILY);
            expect(responseMessage.headers['location']).to.eq(uri);
        });
    });

    describe('ResponseMessageResult', () => {
        it('should respond with an HTTP 302', async () => {
            const responseMessage = new HttpResponseMessage(200);
            const actionResult = new results.ResponseMessageResult(responseMessage);

            expect(await actionResult.executeAsync()).to.eq(responseMessage);
        });
    });

    describe('StatusCodeResult', () => {
        it('should respond with the specified status code', async () => {
            const actionResult = new results.StatusCodeResult(417);
            const responseMessage = await actionResult.executeAsync();
            expect(responseMessage.statusCode).to.eq(417);
        });
    });
});
