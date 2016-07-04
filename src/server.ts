import * as express from "express";
import interfaces from "./interfaces";

/**
 * Wrapper for the express server.
 */
export class InversifyExpressServer  {
    private kernel: inversify.interfaces.Kernel;
    private app: express.Application = express();
    private configFn: interfaces.ConfigFunction;
    private errorConfigFn: interfaces.ConfigFunction;

    /**
     * Wrapper for the express server.
     * 
     * @param kernel Kernel loaded with all controllers and their dependencies.
     */
    constructor(kernel: inversify.interfaces.Kernel) {
        this.kernel = kernel;
    }

    /**
     * Sets the configuration function to be applied to the application. 
     * Note that the config function is not actually executed until a call to InversifyExpresServer.build().
     * 
     * This method is chainable.
     * 
     * @param fn Function in which app-level middleware can be registered.
     */
    public setConfig(fn: interfaces.ConfigFunction): InversifyExpressServer {
        this.configFn = fn;
        return this;
    }

    /**
     * Sets the error handler configuration function to be applied to the application.
     * Note that the error config function is not actually executed until a call to InversifyExpresServer.build().
     * 
     * This method is chainable.
     * 
     * @param fn Function in which app-level error handlers can be registered.
     */
    public setErrorConfig(fn: interfaces.ConfigFunction): InversifyExpressServer {
        this.errorConfigFn = fn;
        return this;
    }

    /**
     * Applies all routes and configuration to the server, returning the express application.
     */
    public build(): express.Application {
        // register server-level middleware before anything else
        if (this.configFn) {
            this.configFn.apply(undefined, [this.app]);
        }

        this.registerControllers();

        // register error handlers after controllers
        if (this.errorConfigFn) {
            this.errorConfigFn.apply(undefined, [this.app]);
        }

        return this.app;
    }

    private registerControllers() {
        let controllers: interfaces.Controller[] = this.kernel.getAll<interfaces.Controller>("Controller");

        controllers.forEach((controller: interfaces.Controller) => {

            let controllerMetadata: interfaces.ControllerMetadata = Reflect.getOwnMetadata(
                "_controller",
                controller.constructor
            );

            let methodMetadata: interfaces.ControllerMethodMetadata[] = Reflect.getOwnMetadata(
                "_controller-method",
                controller.constructor
            );

            if (controllerMetadata && methodMetadata) {
                let router: express.Router = express.Router();

                methodMetadata.forEach((metadata: interfaces.ControllerMethodMetadata) => {
                    let handler: express.RequestHandler = this.handlerFactory(controllerMetadata.target.name, metadata.key);
                    router[metadata.method](metadata.path, ...metadata.middleware, handler);
                });

                this.app.use(controllerMetadata.path, ...controllerMetadata.middleware, router);
            }
        });
    }

    private handlerFactory(controllerName: any, key: string): express.RequestHandler {
        return (req: express.Request, res: express.Response, next: express.NextFunction) => {
            let result: any = this.kernel.getNamed("Controller", controllerName)[key](req, res, next);
            // try to resolve promise
            if (result && result instanceof Promise) {

                result.then((value: any) => {
                    if (value && !res.headersSent) {
                        res.send(value);
                    }
                })
                    .catch((error: any) => {
                        next(error);
                    });

            } else if (result && !res.headersSent) {
                res.send(result);
            }
        };
    }
}
