import * as express from "express";
import { injectable } from "inversify";
import { injectHttpContext } from "./decorators";
import { interfaces } from "./interfaces";

@injectable()
export abstract class BaseMiddleware implements BaseMiddleware {
    // httpContext is initialized when the middleware is invoked
    // see resolveMidleware in server.ts for more details
    protected readonly httpContext: interfaces.HttpContext;
    public abstract handler(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ): void;
}
