import * as express from "express";
import { IKernel } from "inversify";
import { IRouteContainer, RouteContainer } from "./route-container";

/**
 * Wrapper for the express server.
 */
export class InversifyExpressServer  {
    private app: express.Application = express();
    private routeContainer: IRouteContainer;
    private configFn: IConfigFunction;

    /**
     * Wrapper for the express server.
     * 
     * @param kernel Kernel loaded with all controllers and their dependencies.
     */
    constructor(kernel: IKernel) {
        this.routeContainer = RouteContainer.getInstance();
        this.routeContainer.setKernel(kernel);
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
        this.routeContainer.getRoutes().forEach((route) => {
            this.app.use(route.path, ...route.middleware, route.router);
        });
    }
}

interface IConfigFunction {
    (app: express.Application): void;
}
