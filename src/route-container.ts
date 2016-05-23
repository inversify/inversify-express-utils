import * as express from 'express';
import { IRouterMatcher } from 'express-serve-static-core';

var controllerContainer: RouteContainer;

export function refreshContainer() {
    controllerContainer = new RouteContainer();
}

export function getContainer() {
    if (!controllerContainer) refreshContainer();
    return controllerContainer;
}

export class RouteContainer {
    private container: { [s: string]: IContainerRoute }  = {};
    
    public registerHandler(httpMethod: string, path: string, target: any, middleware: express.RequestHandler[], callback: express.RequestHandler) {
        if (!this.container[target.constructor]) {
            this.container[target.constructor] = {
                path: undefined,
                router: express.Router(),
                middleware: undefined
            };
        }
        
        var router: express.Router = this.container[target.constructor].router;        
        var registerHandlerOnRouter = <IRouterMatcher<express.Router>> router[httpMethod];
        
        registerHandlerOnRouter.apply(router, [path, ...middleware, callback]);
    }
    
    public registerController(path: string, middleware: express.RequestHandler[], target: any) {
        
        if (this.container[target]) {
            this.container[target].path = path;
            this.container[target].middleware = middleware;
        }
    }
    
    public getRoutes() {
        var routes: IContainerRoute[] = [];
        for (var i in this.container) {
            if (this.container.hasOwnProperty(i)) {
                routes.push(this.container[i]);
            }
        }
        return routes;
    }
}

interface IContainerRoute {
    path: string;
    router: express.Router;
    middleware: express.RequestHandler[];
}