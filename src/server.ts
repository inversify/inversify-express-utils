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

    /**
     * Wrapper for the express server.
     * 
     * @param kernel Kernel loaded with all controllers and their dependencies.
     */
    constructor(kernel: IKernel) {
        this.kernel = kernel;
    }

    /**
     * Sets the configuration function of the server. 
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
     * Applies the configuration function and all controller routes to the server, in that order.
     */
    public build(): express.Application {
        if (this.configFn) {
            this.configFn.apply(undefined, [this.app]);
        }
        this.useRoutes();
        return this.app;
    }

    private useRoutes() {
        let controllers: IController[] = this.kernel.getAll<IController>("IController");

        controllers.forEach((controller: IController) => {
            let controllerMetadata: IControllerMetadata = Reflect.getOwnMetadata("_controller", controller.constructor);
            let methodMetadataList: IControllerMethodMetadata[] = Reflect.getOwnMetadata("_controller-method", controller.constructor);

            if (controllerMetadata && methodMetadataList) {
                let router: express.Router = express.Router();
                console.log(methodMetadataList);
                methodMetadataList.forEach((methodMetadata: IControllerMethodMetadata) => {
                    let handler: express.RequestHandler = this.handlerFactory(controllerMetadata.target.name, methodMetadata.key);
                    router[methodMetadata.method](methodMetadata.path, ...methodMetadata.middleware, handler);
                });

                this.app.use(controllerMetadata.path, ...controllerMetadata.middleware, router);
            }
        });
    }

    private handlerFactory(controllerName: any, key: string): express.RequestHandler {
        return (req: express.Request, res: express.Response, next: express.NextFunction) => {
            let result: any = this.kernel.getNamed("IController", controllerName)[key](req, res);
                console.log(`called method ${key}`);
                if (!res.headersSent) {
                    res.send(result);
                }
            };
        }
    }

interface IConfigFunction {
    (app: express.Application): void;
}
