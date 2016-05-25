import * as express from "express";
import { IKernel } from "inversify";
import { IRouterMatcher } from "express-serve-static-core";

/**
 * Singleton class which contains the inversify kernel and the registered controller metadata.
 */
export class RouteContainer implements IRouteContainer {
    private static instance: IRouteContainer;
    private container: { [s: string]: IContainerRoute }  = {};
    private kernel: IKernel;

    public static getInstance(): IRouteContainer {
        if (!this.instance) {
            this.instance = new RouteContainer();
        }
        return this.instance;
    }

    /**
     * Used for injecting mock instances.
     */
    public static setInstance(routeContainer: IRouteContainer): void {
        this.instance = routeContainer;
    }

    public setKernel(kernel: IKernel) {
        this.kernel = kernel;
    }

    public registerHandler(httpMethod: string, path: string, middleware: express.RequestHandler[], target: any,
        targetMethod: string) {
        if (!this.container[target.constructor]) {
            this.container[target.constructor] = {
                middleware: undefined,
                path: undefined,
                router: express.Router()
            };
        }

        let router: express.Router = this.container[target.constructor].router;
        let registerHandlerOnRouter = <IRouterMatcher<express.Router>> router[httpMethod];

        let handler: express.RequestHandler = (req: express.Request, res: express.Response, next: any) => {
            let result = this.kernel.get(target.constructor.name)[targetMethod](req, res, next);
            if (!res.headersSent) {
                res.send(result);
            }
        };

        registerHandlerOnRouter.apply(router, [path, ...middleware, handler]);
    }

    public registerController(path: string, middleware: express.RequestHandler[], target: any) {

        if (this.container[target]) {
            this.container[target].path = path;
            this.container[target].middleware = middleware;
        }
    }

    public getRoutes() {
        let routes: IContainerRoute[] = [];
        for (let i in this.container) {
            if (this.container.hasOwnProperty(i)) {
                routes.push(this.container[i]);
            }
        }
        return routes;
    }
}

interface IContainerRoute {
    middleware: express.RequestHandler[];
    path: string;
    router: express.Router;
}

export interface IRouteContainer {
    setKernel(kernel: IKernel): void;
    registerHandler(httpMethod: string, path: string, middleware: express.RequestHandler[], target: any, targetMethod: string): void;
    registerController(path: string, middleware: express.RequestHandler[], target: any): void;
    getRoutes(): IContainerRoute[];
}
