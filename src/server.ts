import * as express from "express";
import * as inversify from "inversify";
import { interfaces } from "./interfaces";
import { BaseMiddleware } from "./index";
import {
    getControllersFromMetadata,
    getControllersFromContainer,
    getControllerMetadata,
    getControllerMethodMetadata,
    getControllerParameterMetadata,
    instanceOfIHttpActionResult
} from "./utils";
import {
    TYPE,
    METADATA_KEY,
    DEFAULT_ROUTING_ROOT_PATH,
    PARAMETER_TYPE,
    DUPLICATED_CONTROLLER_NAME
} from "./constants";
import { HttpResponseMessage } from "./httpResponseMessage";
import { OutgoingHttpHeaders } from "http";

export class InversifyExpressServer {

    private _router: express.Router;
    private _container: inversify.interfaces.Container;
    private _app: express.Application;
    private _configFn: interfaces.ConfigFunction;
    private _errorConfigFn: interfaces.ConfigFunction;
    private _routingConfig: interfaces.RoutingConfig;
    private _AuthProvider: { new(): interfaces.AuthProvider };
    private _forceControllers: boolean;

    /**
     * Wrapper for the express server.
     *
     * @param container Container loaded with all controllers and their dependencies.
     *
     */
    constructor(
        container: inversify.interfaces.Container,
        customRouter?: express.Router | null,
        routingConfig?: interfaces.RoutingConfig | null,
        customApp?: express.Application | null,
        authProvider?: { new(): interfaces.AuthProvider } | null,
        forceControllers = true
    ) {
        this._container = container;
        this._forceControllers = forceControllers;
        this._router = customRouter || express.Router();
        this._routingConfig = routingConfig || {
            rootPath: DEFAULT_ROUTING_ROOT_PATH
        };
        this._app = customApp || express();
        if (authProvider) {
            this._AuthProvider = authProvider;
            container.bind<interfaces.AuthProvider>(TYPE.AuthProvider)
                .to(this._AuthProvider);
        }
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

        const _self = this;

        // The very first middleware to be invoked
        // it creates a new httpContext and attaches it to the
        // current request as metadata using Reflect
        this._app.all("*", (
            req: express.Request,
            res: express.Response,
            next: express.NextFunction
        ) => {
            (async () => {
                const httpContext = await _self._createHttpContext(req, res, next);
                Reflect.defineMetadata(
                    METADATA_KEY.httpContext,
                    httpContext,
                    req
                );
                next();
            })();
        });

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

        // Fake HttpContext is needed during registration
        this._container.bind<interfaces.HttpContext>(TYPE.HttpContext).toConstantValue({} as any);

        let constructors = getControllersFromMetadata();

        constructors.forEach((constructor) => {

            const name = constructor.name;

            if (this._container.isBoundNamed(TYPE.Controller, name)) {
                throw new Error(DUPLICATED_CONTROLLER_NAME(name));
            }

            this._container.bind(TYPE.Controller)
                .to(constructor)
                .whenTargetNamed(name);
        });

        let controllers = getControllersFromContainer(
            this._container,
            this._forceControllers
        );

        controllers.forEach((controller: interfaces.Controller) => {

            let controllerMetadata = getControllerMetadata(controller.constructor);
            let methodMetadata = getControllerMethodMetadata(controller.constructor);
            let parameterMetadata = getControllerParameterMetadata(controller.constructor);

            if (controllerMetadata && methodMetadata) {

                let router: express.Router = express.Router();
                let controllerMiddleware = this.resolveMidleware(...controllerMetadata.middleware);

                methodMetadata.forEach((metadata: interfaces.ControllerMethodMetadata) => {
                    let paramList: interfaces.ParameterMetadata[] = [];
                    if (parameterMetadata) {
                        paramList = parameterMetadata[metadata.key] || [];
                    }
                    let handler: express.RequestHandler = this.handlerFactory(controllerMetadata.target.name, metadata.key, paramList);
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
            if (this._container.isBound(middlewareItem)) {
                type MiddelwareInstance = express.RequestHandler | BaseMiddleware;
                const m = this._container.get<MiddelwareInstance>(middlewareItem);
                if (m instanceof BaseMiddleware) {
                    const _self = this;
                    return function (
                        req: express.Request,
                        res: express.Response,
                        next: express.NextFunction
                    ) {
                        const httpContext = _self._getHttpContext(req);
                        (m as any).httpContext = httpContext;
                        (m as any)._container = _self._container;
                        m.handler(req, res, next);
                    };
                } else {
                    return m;
                }
            } else {
                return middlewareItem as express.RequestHandler;
            }
        });
    }

    private copyHeadersTo(headers: OutgoingHttpHeaders, target: express.Response) {
        for (const name of Object.keys(headers)) {
            const headerValue = headers[name];

            target.append(
                name,
                typeof headerValue === "number" ? headerValue.toString() : headerValue
            );
        }
    }

    private async handleHttpResponseMessage(message: HttpResponseMessage, res: express.Response) {
        this.copyHeadersTo(message.headers, res);
        this.copyHeadersTo(message.content.headers, res);

        if (message.content !== undefined) {
            res.status(message.statusCode)
               // If the content is a number, ensure we change it to a string, else our content is treated
               // as a statusCode rather than as the content of the Response
               .send(await message.content.readAsStringAsync());
        } else {
            res.sendStatus(message.statusCode);
        }
    }

    private handlerFactory(
        controllerName: any,
        key: string,
        parameterMetadata: interfaces.ParameterMetadata[]
    ): express.RequestHandler {
        return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
            try {
                let args = this.extractParameters(req, res, next, parameterMetadata);

                // We use a childContainer for each request so we can be
                // sure that the binding is unique for each HTTP request
                let childContainer = this._container.createChild();
                const httpContext = this._getHttpContext(req);
                childContainer.bind<interfaces.HttpContext>(TYPE.HttpContext)
                    .toConstantValue(httpContext);

                // invoke controller's action
                const value = await childContainer.getNamed<any>(TYPE.Controller, controllerName)[key](...args);

                if (value instanceof HttpResponseMessage) {
                    await this.handleHttpResponseMessage(value, res);
                } else if (instanceOfIHttpActionResult(value)) {
                    const httpResponseMessage = await value.executeAsync();
                    await this.handleHttpResponseMessage(httpResponseMessage, res);
                } else if (value instanceof Function) {
                    value();
                } else if (!res.headersSent) {
                    if (value === undefined) {
                        res.status(204);
                    }
                    res.send(value);
                }
            } catch (err) {
                next(err);
            }
        };
    }

    private _getHttpContext(req: express.Request) {
        const httpContext = Reflect.getMetadata(
            METADATA_KEY.httpContext,
            req
        );
        return httpContext;
    }

    private async _createHttpContext(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        const principal = await this._getCurrentUser(req, res, next);
        const httpContext = {
            request: req,
            response: res,
            user: principal
        };
        return httpContext;
    }

    private async _getCurrentUser(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ): Promise<interfaces.Principal> {
        if (this._AuthProvider !== undefined) {
            const authProvider = this._container.get<interfaces.AuthProvider>(TYPE.AuthProvider);
            return await authProvider.getUser(req, res, next);
        } else {
            return Promise.resolve<interfaces.Principal>({
                details: null,
                isAuthenticated: () => Promise.resolve(false),
                isInRole: (role: string) => Promise.resolve(false),
                isResourceOwner: (resourceId: any) => Promise.resolve(false)
            });
        }
    }

    private extractParameters(req: express.Request, res: express.Response, next: express.NextFunction,
        params: interfaces.ParameterMetadata[]): any[] {
        let args = [];
        if (!params || !params.length) {
            return [req, res, next];
        }
        for (let item of params) {

            switch (item.type) {
                case PARAMETER_TYPE.REQUEST:
                    args[item.index] = req;
                    break;
                case PARAMETER_TYPE.NEXT:
                    args[item.index] = next;
                    break;
                case PARAMETER_TYPE.PARAMS:
                    args[item.index] = this.getParam(req, "params", item.parameterName);
                    break;
                case PARAMETER_TYPE.QUERY:
                    args[item.index] = this.getParam(req, "query", item.parameterName);
                    break;
                case PARAMETER_TYPE.BODY:
                    args[item.index] = req.body;
                    break;
                case PARAMETER_TYPE.HEADERS:
                    args[item.index] = this.getParam(req, "headers", item.parameterName.toLowerCase());
                    break;
                case PARAMETER_TYPE.COOKIES:
                    args[item.index] = this.getParam(req, "cookies", item.parameterName);
                    break;
                default:
                    args[item.index] = res;
                    break; // response
            }

        }
        args.push(req, res, next);
        return args;
    }

    private getParam(source: express.Request, paramType: string, name: string) {
        let param = source[paramType];
        return param ? param[name] : undefined;
    }

}
