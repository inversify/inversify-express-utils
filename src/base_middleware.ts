import * as express from 'express';
import {injectable, interfaces as inversifyInterfaces} from 'inversify';
import * as interfaces from './interfaces';

@injectable()
export abstract class BaseMiddleware implements BaseMiddleware {
    // httpContext is initialized when the middleware is invoked
    // see resolveMidleware in server.ts for more details
    public httpContext!: interfaces.HttpContext;

    protected bind<T>(
        serviceIdentifier: inversifyInterfaces.ServiceIdentifier<T>,
    ): inversifyInterfaces.BindingToSyntax<T> {
        return this.httpContext.container.bind(serviceIdentifier);
    }

    public abstract handler(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ): void;
}
