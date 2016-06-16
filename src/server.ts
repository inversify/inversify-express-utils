import * as express from "express";
import { IKernel } from "inversify";
import { IController, IControllerMetadata, IControllerMethodMetadata } from "./interfaces";

/**
 * Wrapper for the express server.
 */
export class InversifyExpressServer  {
    private kernel: IKernel;
    private app: express.Application = express();
    private configFn: IConfigFunction;
    private errorConfigFn: IConfigFunction;

    /**
     * Wrapper for the express server.
     * 
     * @param kernel Kernel loaded with all controllers and their dependencies.
     */
    constructor(kernel: IKernel) {
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
    public setConfig(fn: IConfigFunction): InversifyExpressServer {
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
    public setErrorConfig(fn: IConfigFunction): InversifyExpressServer {
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
        let controllers: IController[] = this.kernel.getAll<IController>("IController");

        controllers.forEach((controller: IController) => {
            let controllerMetadata: IControllerMetadata = Reflect.getOwnMetadata("_controller", controller.constructor);
            let methodMetadata: IControllerMethodMetadata[] = Reflect.getOwnMetadata("_controller-method", controller.constructor);

            if (controllerMetadata && methodMetadata) {
                let router: express.Router = express.Router();
                
                methodMetadata.forEach((methodMetadata: IControllerMethodMetadata) => {
                    let handler: express.RequestHandler = this.handlerFactory(controllerMetadata.target.name, methodMetadata.key);
                    router[methodMetadata.method](methodMetadata.path, ...methodMetadata.middleware, handler);
                });

                this.app.use(controllerMetadata.path, ...controllerMetadata.middleware, router);
            }
        });
    }

    private handlerFactory(controllerName: any, key: string): express.RequestHandler {
        return (req: express.Request, res: express.Response, next: express.NextFunction) => {
            let result: any = this.kernel.getNamed("IController", controllerName)[key](req, res, next);
            // try to resolve promise
            if (result && result instanceof Promise) {

                result.then((value: any) => {
                    if (value && !res.headersSent) {
                        res.send(value);
                    }
                });

            } else if (result && !res.headersSent) {
                res.send(result);
            }
        };
    }
}

interface IConfigFunction {
    (app: express.Application): void;
}
