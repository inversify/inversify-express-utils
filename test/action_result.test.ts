import { StatusCodes } from 'http-status-codes';
import { BadRequestErrorMessageResult, BadRequestResult, ConflictResult, CreatedNegotiatedContentResult, ExceptionResult, InternalServerErrorResult, NotFoundResult, OkNegotiatedContentResult, OkResult, RedirectResult, ResponseMessageResult, StatusCodeResult } from '../src/results';
import { HttpResponseMessage } from '../src/httpResponseMessage';

describe('ActionResults', () => {
  describe('OkResult', () => {
    it('should respond with an HTTP 200', async () => {
      const actionResult = new OkResult();
      const responseMessage = await actionResult.executeAsync();

      expect(responseMessage.statusCode).toBe(StatusCodes.OK);
    });
  });

  describe('OkNegotiatedContentResult', () => {
    it('should respond with an HTTP 200 with content', async () => {
      const content = {
        foo: 'bar',
      };
      const actionResult = new OkNegotiatedContentResult(content);
      const responseMessage = await actionResult.executeAsync();

      expect(responseMessage.statusCode).toBe(StatusCodes.OK);
      expect(
        await responseMessage.content.readAsStringAsync(),
      ).toBe(JSON.stringify(content));
    });
  });

  describe('BadRequestResult', () => {
    it('should respond with an HTTP 400', async () => {
      const actionResult = new BadRequestResult();
      const responseMessage = await actionResult.executeAsync();

      expect(responseMessage.statusCode).toBe(StatusCodes.BAD_REQUEST);
    });
  });

  describe('BadRequestErrorMessageResult', () => {
    it('should respond with an HTTP 400 and an error message', async () => {
      const message = 'uh oh!';
      const actionResult = new BadRequestErrorMessageResult(message);
      const responseMessage = await actionResult.executeAsync();

      expect(responseMessage.statusCode).toBe(StatusCodes.BAD_REQUEST);
      expect(await responseMessage.content.readAsStringAsync()).toBe(message);
    });
  });

  describe('ConflictResult', () => {
    it('should respond with an HTTP 409', async () => {
      const actionResult = new ConflictResult();
      const responseMessage = await actionResult.executeAsync();

      expect(responseMessage.statusCode).toBe(StatusCodes.CONFLICT);
    });
  });

  describe('CreatedNegotiatedContentResult', () => {
    it('should respond with an HTTP 302 and appropriate headers', async () => {
      const uri = 'http://foo/bar';
      const content = {
        foo: 'bar',
      };

      const actionResult = new CreatedNegotiatedContentResult(uri, content);
      const responseMessage = await actionResult.executeAsync();

      expect(responseMessage.statusCode).toBe(StatusCodes.CREATED);
      expect(
        await responseMessage.content.readAsStringAsync(),
      ).toBe(JSON.stringify(content));
      expect(responseMessage.headers['location']).toBe(uri);
    });
  });

  describe('ExceptionResult', () => {
    it('should respond with an HTTP 500 and the error message', async () => {
      const error = new Error('foo');

      const actionResult = new ExceptionResult(error);
      const responseMessage = await actionResult.executeAsync();

      expect(responseMessage.statusCode)
        .toBe(StatusCodes.INTERNAL_SERVER_ERROR);

      expect(await responseMessage.content
        .readAsStringAsync())
        .toBe('Error: foo');
    });
  });

  describe('InternalServerErrorResult', () => {
    it('should respond with an HTTP 500', async () => {
      const actionResult = new InternalServerErrorResult();
      const responseMessage = await actionResult.executeAsync();

      expect(responseMessage.statusCode)
        .toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });

  describe('NotFoundResult', () => {
    it('should respond with an HTTP 404', async () => {
      const actionResult = new NotFoundResult();
      const responseMessage = await actionResult.executeAsync();

      expect(responseMessage.statusCode).toBe(StatusCodes.NOT_FOUND);
    });
  });

  describe('RedirectResult', () => {
    it('should respond with an HTTP 302', async () => {
      const uri = 'http://foo/bar';
      const actionResult = new RedirectResult(uri);
      const responseMessage = await actionResult.executeAsync();

      expect(responseMessage.statusCode).toBe(StatusCodes.MOVED_TEMPORARILY);
      expect(responseMessage.headers['location']).toBe(uri);
    });
  });

  describe('ResponseMessageResult', () => {
    it('should respond with an HTTP 302', async () => {
      const responseMessage = new HttpResponseMessage(200);
      const actionResult = new ResponseMessageResult(responseMessage);

      expect(await actionResult.executeAsync()).toBe(responseMessage);
    });
  });

  describe('StatusCodeResult', () => {
    it('should respond with the specified status code', async () => {
      const actionResult = new StatusCodeResult(417);
      const responseMessage = await actionResult.executeAsync();

      expect(responseMessage.statusCode).toBe(417);
    });
  });
});
