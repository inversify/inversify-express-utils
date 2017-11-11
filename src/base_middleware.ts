import * as express from "express";
import { injectable } from "inversify";
import { httpContext } from "./decorators";
import { interfaces } from "./interfaces";

@injectable()
export abstract class BaseMiddleware implements BaseMiddleware {
    @httpContext protected httpContext: interfaces.HttpContext;
    public abstract handler(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ): void;
}
