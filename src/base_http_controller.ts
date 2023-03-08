import { injectable } from 'inversify';
import { URL } from 'node:url';
import { Readable } from 'node:stream';
import { StatusCodes } from 'http-status-codes';
import { injectHttpContext } from './decorators';
import { HttpResponseMessage } from './httpResponseMessage';
import { CreatedNegotiatedContentResult, ConflictResult, OkNegotiatedContentResult, OkResult, BadRequestErrorMessageResult, BadRequestResult, ExceptionResult, InternalServerErrorResult, NotFoundResult, RedirectResult, ResponseMessageResult, StatusCodeResult, JsonResult, StreamResult } from './results';
import type { HttpContext } from './interfaces';

@injectable()
export class BaseHttpController {
  @injectHttpContext protected readonly httpContext!: HttpContext;

  protected created<T>(
    location: string | URL,
    content: T
  ): CreatedNegotiatedContentResult<T> {
    return new CreatedNegotiatedContentResult(location, content);
  }

  protected conflict(): ConflictResult {
    return new ConflictResult();
  }

  protected ok<T>(content: T): OkNegotiatedContentResult<T>;
  protected ok(): OkResult;
  protected ok<T>(content?: T): OkResult {
    return content === undefined
      ? new OkResult()
      : new OkNegotiatedContentResult(content);
  }

  protected badRequest(): BadRequestResult;
  protected badRequest(message: string): BadRequestErrorMessageResult;
  protected badRequest(message?: string): BadRequestResult {
    return message === undefined
      ? new BadRequestResult()
      : new BadRequestErrorMessageResult(message);
  }

  protected internalServerError(): InternalServerErrorResult;
  protected internalServerError(error: Error): ExceptionResult;
  protected internalServerError(error?: Error): InternalServerErrorResult {
    return error ? new ExceptionResult(error) : new InternalServerErrorResult();
  }

  protected notFound(): NotFoundResult {
    return new NotFoundResult();
  }

  protected redirect(uri: string | URL): RedirectResult {
    return new RedirectResult(uri);
  }

  protected responseMessage(
    message: HttpResponseMessage
  ): ResponseMessageResult {
    return new ResponseMessageResult(message);
  }

  protected statusCode(statusCode: number): StatusCodeResult {
    return new StatusCodeResult(statusCode);
  }

  protected json<T extends Record<string, unknown>>(
    content: T | T[],
    statusCode: number = StatusCodes.OK
  ): JsonResult<T> {
    return new JsonResult(content, statusCode);
  }
  
  protected stream(
      readableStream: Readable,
      contentType: string,
      statusCode: number = StatusCodes.OK
  ): StreamResult {
    return new StreamResult(readableStream, contentType, statusCode);
  }
}
