import { describe, expect, it } from '@jest/globals';
import { StatusCodes } from 'http-status-codes';

import { HttpResponseMessage } from '../httpResponseMessage';
import {
  BadRequestErrorMessageResult,
  BadRequestResult,
  ConflictResult,
  CreatedNegotiatedContentResult,
  ExceptionResult,
  InternalServerErrorResult,
  NotFoundResult,
  OkNegotiatedContentResult,
  OkResult,
  RedirectResult,
  ResponseMessageResult,
  StatusCodeResult,
} from '../results';

describe('ActionResults', () => {
  describe('OkResult', () => {
    it('should respond with an HTTP 200', async () => {
      const actionResult: OkResult = new OkResult();
      const responseMessage: HttpResponseMessage =
        await actionResult.executeAsync();

      expect(responseMessage.statusCode).toBe(StatusCodes.OK);
    });
  });

  describe('OkNegotiatedContentResult', () => {
    it('should respond with an HTTP 200 with content', async () => {
      const content: { foo: string } = {
        foo: 'bar',
      };

      const actionResult: OkNegotiatedContentResult<{ foo: string }> =
        new OkNegotiatedContentResult(content);

      const responseMessage: HttpResponseMessage =
        await actionResult.executeAsync();

      expect(responseMessage.statusCode).toBe(StatusCodes.OK);
      expect(await responseMessage.content.readAsync()).toStrictEqual(content);
    });
  });

  describe('BadRequestResult', () => {
    it('should respond with an HTTP 400', async () => {
      const actionResult: BadRequestResult = new BadRequestResult();
      const responseMessage: HttpResponseMessage =
        await actionResult.executeAsync();

      expect(responseMessage.statusCode).toBe(StatusCodes.BAD_REQUEST);
    });
  });

  describe('BadRequestErrorMessageResult', () => {
    it('should respond with an HTTP 400 and an error message', async () => {
      const message: string = 'uh oh!';
      const actionResult: BadRequestErrorMessageResult =
        new BadRequestErrorMessageResult(message);
      const responseMessage: HttpResponseMessage =
        await actionResult.executeAsync();

      expect(responseMessage.statusCode).toBe(StatusCodes.BAD_REQUEST);
      expect(await responseMessage.content.readAsync()).toBe(message);
    });
  });

  describe('ConflictResult', () => {
    it('should respond with an HTTP 409', async () => {
      const actionResult: ConflictResult = new ConflictResult();
      const responseMessage: HttpResponseMessage =
        await actionResult.executeAsync();

      expect(responseMessage.statusCode).toBe(StatusCodes.CONFLICT);
    });
  });

  describe('CreatedNegotiatedContentResult', () => {
    it('should respond with an HTTP 302 and appropriate headers', async () => {
      const uri: string = 'http://foo/bar';
      const content: { foo: string } = {
        foo: 'bar',
      };

      const actionResult: CreatedNegotiatedContentResult<{ foo: string }> =
        new CreatedNegotiatedContentResult(uri, content);

      const responseMessage: HttpResponseMessage =
        await actionResult.executeAsync();

      expect(responseMessage.statusCode).toBe(StatusCodes.CREATED);
      expect(await responseMessage.content.readAsync()).toBe(
        JSON.stringify(content),
      );
      expect(responseMessage.headers['location']).toBe(uri);
    });
  });

  describe('ExceptionResult', () => {
    it('should respond with an HTTP 500 and the error message', async () => {
      const error: Error = new Error('foo');

      const actionResult: ExceptionResult = new ExceptionResult(error);
      const responseMessage: HttpResponseMessage =
        await actionResult.executeAsync();

      expect(responseMessage.statusCode).toBe(
        StatusCodes.INTERNAL_SERVER_ERROR,
      );

      expect(await responseMessage.content.readAsync()).toBe('Error: foo');
    });
  });

  describe('InternalServerErrorResult', () => {
    it('should respond with an HTTP 500', async () => {
      const actionResult: InternalServerErrorResult =
        new InternalServerErrorResult();
      const responseMessage: HttpResponseMessage =
        await actionResult.executeAsync();

      expect(responseMessage.statusCode).toBe(
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    });
  });

  describe('NotFoundResult', () => {
    it('should respond with an HTTP 404', async () => {
      const actionResult: NotFoundResult = new NotFoundResult();
      const responseMessage: HttpResponseMessage =
        await actionResult.executeAsync();

      expect(responseMessage.statusCode).toBe(StatusCodes.NOT_FOUND);
    });
  });

  describe('RedirectResult', () => {
    it('should respond with an HTTP 302', async () => {
      const uri: string = 'http://foo/bar';
      const actionResult: RedirectResult = new RedirectResult(uri);
      const responseMessage: HttpResponseMessage =
        await actionResult.executeAsync();

      expect(responseMessage.statusCode).toBe(StatusCodes.MOVED_TEMPORARILY);
      expect(responseMessage.headers['location']).toBe(uri);
    });
  });

  describe('ResponseMessageResult', () => {
    it('should respond with an HTTP 302', async () => {
      const responseMessage: HttpResponseMessage = new HttpResponseMessage(200);
      const actionResult: ResponseMessageResult = new ResponseMessageResult(
        responseMessage,
      );

      expect(await actionResult.executeAsync()).toBe(responseMessage);
    });
  });

  describe('StatusCodeResult', () => {
    it('should respond with the specified status code', async () => {
      const actionResult: StatusCodeResult = new StatusCodeResult(417);
      const responseMessage: HttpResponseMessage =
        await actionResult.executeAsync();

      expect(responseMessage.statusCode).toBe(417);
    });
  });
});
