import * as express from "express";
import * as inversify from "inversify";
import { interfaces } from "./interfaces";
import { TYPE, METADATA_KEY, DEFAULT_ROUTING_ROOT_PATH } from "./constants";

/**
 * Wrapper for the express server.
 */
export class InversifyExpressServer  {

    private _router: express.Router;
    private _container: inversify.interfaces.Container;
    private _app: express.Application;
    private _configFn: interfaces.ConfigFunction;
    private _errorConfigFn: interfaces.ConfigFunction;
    private _routingConfig: interfaces.RoutingConfig;

    /**
     * Wrapper for the express server.
     *
     * @param container Container loaded with all controllers and their dependencies.
     */
    constructor(
        container: inversify.interfaces.Container,
        customRouter?: express.Router,
        routingConfig?: interfaces.RoutingConfig,
        customApp?: express.Application
    ) {
        this._container = container;
        this._router = customRouter || express.Router();
        this._routingConfig = routingConfig || {
            rootPath: DEFAULT_ROUTING_ROOT_PATH
        };
        this._app = customApp || express();
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
        this._configFn = fn;
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
        this._errorConfigFn = fn;
        return this;
    }

    /**
     * Applies all routes and configuration to the server, returning the express application.
     */
    public build(): express.Application {
        // register server-level middleware before anything else
        if (this._configFn) {
            this._configFn.apply(undefined, [this._app]);
        }

        this.registerControllers();

        // register error handlers after controllers
        if (this._errorConfigFn) {
            this._errorConfigFn.apply(undefined, [this._app]);
        }

        return this._app;
    }

    private registerControllers() {

        let controllers: interfaces.Controller[] = this._container.getAll<interfaces.Controller>(TYPE.Controller);

        controllers.forEach((controller: interfaces.Controller) => {

            let controllerMetadata: interfaces.ControllerMetadata = Reflect.getOwnMetadata(
                METADATA_KEY.controller,
                controller.constructor
            );

            let methodMetadata: interfaces.ControllerMethodMetadata[] = Reflect.getOwnMetadata(
                METADATA_KEY.controllerMethod,
                controller.constructor
            );

            if (controllerMetadata && methodMetadata) {
                let router: express.Router = express.Router();
                let controllerMiddleware = this.resolveMidleware(...controllerMetadata.middleware);

                methodMetadata.forEach((metadata: interfaces.ControllerMethodMetadata) => {
                    let handler: express.RequestHandler = this.handlerFactory(controllerMetadata.target.name, metadata.key);
                    let routeMiddleware = this.resolveMidleware(...metadata.middleware);
                    this._router[metadata.method](
                        `${controllerMetadata.path}${metadata.path}`,
                        ...controllerMiddleware,
                        ...routeMiddleware,
                        handler
                    );
                });
            }
        });

        this._app.use(this._routingConfig.rootPath, this._router);
    }

    private resolveMidleware(...middleware: interfaces.Middleware[]): express.RequestHandler[] {
        return middleware.map(middlewareItem => {
            try {
                return this._container.get<express.RequestHandler>(middlewareItem);
            } catch (_) {
                return middlewareItem as express.RequestHandler;
            }
        });
    }

    private handlerFactory(controllerName: any, key: string): express.RequestHandler {
        return (req: express.Request, res: express.Response, next: express.NextFunction) => {
            let result: any = this._container.getNamed(TYPE.Controller, controllerName)[key](req, res, next);
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
