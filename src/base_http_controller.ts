import { injectable } from "inversify";
import { injectHttpContext } from "./decorators";
import { interfaces } from "./interfaces";
import { HttpResponseMessage } from "./httpResponseMessage";
import { URL } from "url";
import {
    CreatedNegotiatedContentResult,
    ConflictResult,
    OkNegotiatedContentResult,
    OkResult,
    BadRequestErrorMessageResult,
    BadRequestResult,
    ExceptionResult,
    InternalServerErrorResult,
    NotFoundResult,
    RedirectResult,
    ResponseMessageResult,
    StatusCodeResult
} from "./results";

@injectable()
export class BaseHttpController {
    @injectHttpContext protected readonly httpContext: interfaces.HttpContext;

    protected created<T>(location: string | URL, content: T) {
        return new CreatedNegotiatedContentResult(location, content, this);
    }

    protected conflict() {
        return new ConflictResult(this);
    }

    protected ok<T>(content: T): OkNegotiatedContentResult<T>;
    protected ok(): OkResult;
    protected ok<T>(content?: T) {
        return content === undefined ?
            new OkResult(this) :
            new OkNegotiatedContentResult(content, this);
    }

    protected badRequest(): BadRequestResult;
    protected badRequest(message: string): BadRequestErrorMessageResult;
    protected badRequest(message?: string) {
        return message === undefined ?
            new BadRequestResult(this) :
            new BadRequestErrorMessageResult(message, this);
    }

    protected internalServerError(): InternalServerErrorResult;
    protected internalServerError(error: Error): ExceptionResult;
    protected internalServerError(error?: Error) {
        return error ? new ExceptionResult(error, this) : new InternalServerErrorResult(this);
    }

    protected notFound() {
        return new NotFoundResult(this);
    }

    protected redirect(uri: string | URL) {
        return new RedirectResult(uri, this);
    }

    protected responseMessage(message: HttpResponseMessage) {
        return new ResponseMessageResult(message, this);
    }

    protected statusCode(statusCode: number) {
        return new StatusCodeResult(statusCode, this);
    }
}
