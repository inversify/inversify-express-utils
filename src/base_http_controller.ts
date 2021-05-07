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
    StatusCodeResult,
    JsonResult
} from "./results";
import { OK } from "http-status-codes";

@injectable()
export class BaseHttpController {
    @injectHttpContext protected readonly httpContext!: interfaces.HttpContext;

    protected created<T>(location: string | URL, content: T) {
        return new CreatedNegotiatedContentResult(location, content);
    }

    protected conflict() {
        return new ConflictResult();
    }

    protected ok<T>(content: T): OkNegotiatedContentResult<T>;
    protected ok(): OkResult;
    protected ok<T>(content?: T) {
        return content === undefined ?
            new OkResult() :
            new OkNegotiatedContentResult(content);
    }

    protected badRequest(): BadRequestResult;
    protected badRequest(message: string): BadRequestErrorMessageResult;
    protected badRequest(message?: string) {
        return message === undefined ?
            new BadRequestResult() :
            new BadRequestErrorMessageResult(message);
    }

    protected internalServerError(): InternalServerErrorResult;
    protected internalServerError(error: Error): ExceptionResult;
    protected internalServerError(error?: Error) {
        return error ? new ExceptionResult(error) : new InternalServerErrorResult();
    }

    protected notFound() {
        return new NotFoundResult();
    }

    protected redirect(uri: string | URL) {
        return new RedirectResult(uri);
    }

    protected responseMessage(message: HttpResponseMessage) {
        return new ResponseMessageResult(message);
    }

    protected statusCode(statusCode: number) {
        return new StatusCodeResult(statusCode);
    }

    protected json(content: any, statusCode: number = OK) {
        return new JsonResult(content, statusCode);
    }
}
