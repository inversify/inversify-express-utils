import { Readable } from 'node:stream';
import { URL } from 'node:url';

import { StatusCodes } from 'http-status-codes';
import { injectable } from 'inversify';

import { injectHttpContext } from './decorators';
import { HttpResponseMessage } from './httpResponseMessage';
import type { HttpContext } from './interfaces';
import {
  BadRequestErrorMessageResult,
  BadRequestResult,
  ConflictResult,
  CreatedNegotiatedContentResult,
  ExceptionResult,
  InternalServerErrorResult,
  JsonResult,
  NotFoundResult,
  OkNegotiatedContentResult,
  OkResult,
  RedirectResult,
  ResponseMessageResult,
  StatusCodeResult,
  StreamResult,
} from './results';

@injectable()
export class BaseHttpController {
  @injectHttpContext protected readonly httpContext!: HttpContext;

  protected created<T>(
    location: string | URL,
    content: T,
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
    message: HttpResponseMessage,
  ): ResponseMessageResult {
    return new ResponseMessageResult(message);
  }

  protected statusCode(statusCode: number): StatusCodeResult {
    return new StatusCodeResult(statusCode);
  }

  protected json(
    content: unknown,
    statusCode: number = StatusCodes.OK,
  ): JsonResult {
    return new JsonResult(content, statusCode);
  }

  protected stream(
    readableStream: Readable,
    contentType: string,
    statusCode: number = StatusCodes.OK,
  ): StreamResult {
    return new StreamResult(readableStream, contentType, statusCode);
  }
}
