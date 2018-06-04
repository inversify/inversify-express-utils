import * as express from "express";
import { Container, injectable, interfaces as inversifyInterfaces } from "inversify";
import { injectHttpContext } from "./decorators";
import { interfaces } from "./interfaces";

@injectable()
export abstract class BaseMiddleware implements BaseMiddleware {
    // httpContext is initialized when the middleware is invoked
    // see resolveMidleware in server.ts for more details
    protected readonly httpContext: interfaces.HttpContext;

    private readonly _container: Container;

    protected bind<T>(serviceIdentifier: inversifyInterfaces.ServiceIdentifier<T>): inversifyInterfaces.BindingToSyntax<T> {
        return this._container.isBound(serviceIdentifier)
            ? this._container.rebind(serviceIdentifier)
            : this._container.bind(serviceIdentifier);
    }

    public abstract handler(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ): void;
}
