import * as express from "express";
import { IKernel } from "inversify";
import { setKernel } from "./kernel";
import { getContainer } from "./route-container";

/**
 * Wrapper for the express server.
 */
export class InversifyExpressServer  {
    private app: express.Application = express();
    private configFn: Function;

    /**
     * Wrapper for the express server.
     * 
     * @param kernel Kernel loaded with all controllers and their dependencies.
     */
    constructor(kernel: IKernel) {
        setKernel(kernel);
    }

    /**
     * Sets the configuration function of the server. 
     * Note that the config function is not actually executed until a call to InversifyExpresServer.build().
     * 
     * This method is chainable.
     * 
     * @param fn Function in which app-level middleware can be registered.
     */
    setConfig(fn: IConfigFunction): InversifyExpressServer {
        this.configFn = fn;
        return this;
    }

    /**
     * Applies the configuration function and all controller routes to the server, in that order.
     * 
     */
    build(): express.Application {
        if (this.configFn) {
            this.configFn.apply(undefined, [this.app]);
        }
        this.useRoutes();
        return this.app;
    }

    private useRoutes() {
        getContainer().getRoutes().forEach((route) => {
            this.app.use(route.path, ...route.middleware, route.router);
        });
    }
}

interface IConfigFunction {
    (app: express.Application): void;
}