import { injectable } from 'inversify';
import { URL } from 'url';
import { StatusCodes } from 'http-status-codes';
import { injectHttpContext } from './decorators';
import { HttpResponseMessage } from './httpResponseMessage';
import { CreatedNegotiatedContentResult, ConflictResult, OkNegotiatedContentResult, OkResult, BadRequestErrorMessageResult, BadRequestResult, ExceptionResult, InternalServerErrorResult, NotFoundResult, RedirectResult, ResponseMessageResult, StatusCodeResult, JsonResult, } from './results';
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

  protected json(
    content: object,
    statusCode: number = StatusCodes.OK
  ): JsonResult {
    return new JsonResult(content, statusCode);
  }
}
