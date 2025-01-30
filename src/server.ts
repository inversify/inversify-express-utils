import 'reflect-metadata';

import type { OutgoingHttpHeader, OutgoingHttpHeaders } from 'node:http';

import express, {
  Application,
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router,
} from 'express';
import { interfaces } from 'inversify';

import { BaseMiddleware } from './base_middleware';
import {
  DEFAULT_ROUTING_ROOT_PATH,
  DUPLICATED_CONTROLLER_NAME,
  HTTP_VERBS_ENUM,
  METADATA_KEY,
  PARAMETER_TYPE,
  TYPE,
} from './constants';
import { HttpResponseMessage } from './httpResponseMessage';
import type {
  AuthProvider,
  ConfigFunction,
  Controller,
  ControllerHandler,
  ControllerMetadata,
  ControllerMethodMetadata,
  ControllerParameterMetadata,
  DecoratorTarget,
  ExtractedParameters,
  HttpContext,
  Middleware,
  ParameterMetadata,
  Principal,
  RoutingConfig,
} from './interfaces';
import {
  getControllerMetadata,
  getControllerMethodMetadata,
  getControllerParameterMetadata,
  getControllersFromContainer,
  getControllersFromMetadata,
  instanceOfIhttpActionResult,
} from './utils';

export class InversifyExpressServer {
  private readonly _router: Router;
  private readonly _container: interfaces.Container;
  private readonly _app: Application;
  private _configFn!: ConfigFunction;
  private _errorConfigFn!: ConfigFunction;
  private readonly _routingConfig: RoutingConfig;
  private readonly _authProvider!: new () => AuthProvider;
  private readonly _forceControllers: boolean;

  /**
   * Wrapper for the express server.
   *
   * @param container Container loaded with all controllers and their dependencies.
   * @param customRouter optional express.Router custom router
   * @param routingConfig optional interfaces.RoutingConfig routing config
   * @param customApp optional express.Application custom app
   * @param authProvider optional interfaces.AuthProvider auth provider
   * @param forceControllers optional boolean setting to force controllers (defaults do true)
   */
  constructor(
    container: interfaces.Container,
    customRouter?: Router | null,
    routingConfig?: RoutingConfig | null,
    customApp?: Application | null,
    authProvider?: (new () => AuthProvider) | null,
    forceControllers: boolean = true,
  ) {
    this._container = container;
    this._forceControllers = forceControllers;
    this._router = customRouter || Router();
    this._routingConfig = routingConfig || {
      rootPath: DEFAULT_ROUTING_ROOT_PATH,
    };
    this._app = customApp || express();
    if (authProvider) {
      this._authProvider = authProvider;
      container.bind<AuthProvider>(TYPE.AuthProvider).to(this._authProvider);
    }
  }

  /**
   * Sets the configuration function to be applied to the application.
   * Note that the config function is not actually executed until a call to
   * InversifyExpresServer.build().
   *
   * This method is chainable.
   *
   * @param fn Function in which app-level middleware can be registered.
   */
  public setConfig(fn: ConfigFunction): this {
    this._configFn = fn;
    return this;
  }

  /**
   * Sets the error handler configuration function to be applied to the application.
   * Note that the error config function is not actually executed until a call to
   * InversifyExpresServer.build().
   *
   * This method is chainable.
   *
   * @param fn Function in which app-level error handlers can be registered.
   */
  public setErrorConfig(fn: ConfigFunction): this {
    this._errorConfigFn = fn;
    return this;
  }

  /**
   * Applies all routes and configuration to the server, returning the express application.
   */
  public build(): express.Application {
    // The very first middleware to be invoked
    // it creates a new httpContext and attaches it to the
    // current request as metadata using Reflect
    this._app.all('*', (req: Request, res: Response, next: NextFunction) => {
      void (async (): Promise<void> => {
        const httpContext: HttpContext = await this._createHttpContext(
          req,
          res,
          next,
        );
        Reflect.defineMetadata(METADATA_KEY.httpContext, httpContext, req);
        next();
      })();
    });

    // register server-level middleware before anything else
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
    if (this._configFn) {
      this._configFn.apply(undefined, [this._app]);
    }

    this.registerControllers();

    // register error handlers after controllers
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
    if (this._errorConfigFn) {
      this._errorConfigFn.apply(undefined, [this._app]);
    }

    return this._app;
  }

  private registerControllers(): void {
    // Fake HttpContext is needed during registration
    this._container
      .bind<HttpContext>(TYPE.HttpContext)
      .toConstantValue({} as HttpContext);

    const constructors: DecoratorTarget[] = getControllersFromMetadata();

    constructors.forEach((constructor: DecoratorTarget) => {
      const { name }: { name: string } = constructor as { name: string };

      if (this._container.isBoundNamed(TYPE.Controller, name)) {
        throw new Error(DUPLICATED_CONTROLLER_NAME(name));
      }

      this._container
        .bind(TYPE.Controller)
        .to(constructor as new (...args: never[]) => unknown)
        .whenTargetNamed(name);
    });

    const controllers: Controller[] = getControllersFromContainer(
      this._container,
      this._forceControllers,
    );

    controllers.forEach((controller: Controller) => {
      const controllerMetadata: ControllerMetadata = getControllerMetadata(
        controller.constructor,
      );
      const methodMetadata: ControllerMethodMetadata[] =
        getControllerMethodMetadata(controller.constructor);
      const parameterMetadata: ControllerParameterMetadata =
        getControllerParameterMetadata(controller.constructor);

      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unnecessary-condition
      if (controllerMetadata && methodMetadata) {
        const controllerMiddleware: RequestHandler[] = this.resolveMiddlewere(
          ...controllerMetadata.middleware,
        );

        // Priorirties for HTTP methods. Lower value means higher priority. Default is 0.
        const methodToPriorityMap: Record<string, number> = {
          [HTTP_VERBS_ENUM.head]: -1,
        };

        const sortedMethodMetadata: ControllerMethodMetadata[] =
          methodMetadata.sort((a, b) => {
            const aPriority: number = methodToPriorityMap[a.method] ?? 0;
            const bPriority: number = methodToPriorityMap[b.method] ?? 0;
            return aPriority - bPriority;
          });

        sortedMethodMetadata.forEach((metadata: ControllerMethodMetadata) => {
          let paramList: ParameterMetadata[] = [];
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
          if (parameterMetadata) {
            paramList = parameterMetadata[metadata.key] || [];
          }
          const handler: RequestHandler = this.handlerFactory(
            (controllerMetadata.target as { name: string }).name,
            metadata.key,
            paramList,
          );

          const routeMiddleware: RequestHandler[] = this.resolveMiddlewere(
            ...metadata.middleware,
          );

          const path: string = this.mergePaths(
            controllerMetadata.path,
            metadata.path,
          );

          this._router[metadata.method](
            path,
            ...controllerMiddleware,
            ...routeMiddleware,
            handler,
          );
        });
      }
    });

    this._app.use(this._routingConfig.rootPath, this._router);
  }

  private mergePaths(...paths: string[]) {
    return paths
      .map((path: string) => {
        let finalPath: string =
          path.startsWith('/') || path.startsWith('.') ? path : `/${path}`;

        if (path.endsWith('/')) {
          finalPath = finalPath.substring(0, finalPath.length - 1);
        }

        return finalPath;
      })
      .join('');
  }

  private resolveMiddlewere(...middleware: Middleware[]): RequestHandler[] {
    return middleware.map((middlewareItem: Middleware) => {
      if (!this._container.isBound(middlewareItem)) {
        return middlewareItem as express.RequestHandler;
      }

      type MiddlewareInstance = RequestHandler | BaseMiddleware;
      const middlewareInstance: MiddlewareInstance =
        this._container.get<MiddlewareInstance>(middlewareItem);

      if (middlewareInstance instanceof BaseMiddleware) {
        return (
          req: Request,
          res: Response,
          next: NextFunction,
        ): void | Promise<void> => {
          const mReq: BaseMiddleware =
            this._container.get<BaseMiddleware>(middlewareItem);
          mReq.httpContext = this._getHttpContext(req);

          return mReq.handler(req, res, next);
        };
      }

      return middlewareInstance;
    });
  }

  private copyHeadersTo(headers: OutgoingHttpHeaders, target: Response): void {
    for (const name of Object.keys(headers)) {
      const headerValue: OutgoingHttpHeader | undefined = headers[name];

      target.append(
        name,
        typeof headerValue === 'number' ? headerValue.toString() : headerValue,
      );
    }
  }

  private async handleHttpResponseMessage(
    message: HttpResponseMessage,
    res: express.Response,
  ): Promise<void> {
    this.copyHeadersTo(message.headers, res);

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (message.content !== undefined) {
      this.copyHeadersTo(message.content.headers, res);

      res
        .status(message.statusCode)
        // If the content is a number, ensure we change it to a string, else our content is
        // treated as a statusCode rather than as the content of the Response
        .send(await message.content.readAsync());
    } else {
      res.sendStatus(message.statusCode);
    }
  }

  private handlerFactory(
    controllerName: string,
    key: string,
    parameterMetadata: ParameterMetadata[],
  ): RequestHandler {
    return (async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      try {
        const args: ExtractedParameters = this.extractParameters(
          req,
          res,
          next,
          parameterMetadata,
        );
        const httpContext: HttpContext = this._getHttpContext(req);
        httpContext.container
          .bind<HttpContext>(TYPE.HttpContext)
          .toConstantValue(httpContext);

        // invoke controller's action
        const value: unknown = await (
          httpContext.container.getNamed<Record<string, ControllerHandler>>(
            TYPE.Controller,
            controllerName,
          )[key] as ControllerHandler
        )(...args);

        if (value instanceof HttpResponseMessage) {
          await this.handleHttpResponseMessage(value, res);
        } else if (instanceOfIhttpActionResult(value)) {
          const httpResponseMessage: HttpResponseMessage =
            await value.executeAsync();
          await this.handleHttpResponseMessage(httpResponseMessage, res);
        } else if (value instanceof Function) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          value();
        } else if (!res.headersSent) {
          if (value !== undefined) {
            res.send(value);
          }
        }
      } catch (err) {
        next(err);
      }
    }) as RequestHandler;
  }

  private _getHttpContext(req: express.Request): HttpContext {
    return Reflect.getMetadata(METADATA_KEY.httpContext, req) as HttpContext;
  }

  private async _createHttpContext(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<HttpContext> {
    const principal: Principal = await this._getCurrentUser(req, res, next);

    return {
      // We use a childContainer for each request so we can be
      // sure that the binding is unique for each HTTP request
      container: this._container.createChild(),
      request: req,
      response: res,
      user: principal,
    };
  }

  private async _getCurrentUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Principal> {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (this._authProvider !== undefined) {
      const authProvider: AuthProvider = this._container.get<AuthProvider>(
        TYPE.AuthProvider,
      );
      return authProvider.getUser(req, res, next);
    }
    return Promise.resolve<Principal>({
      details: null,
      isAuthenticated: async (): Promise<boolean> => false,
      isInRole: async (_role: string): Promise<boolean> => false,
      isResourceOwner: async (_resourceId: unknown): Promise<boolean> => false,
    });
  }

  private extractParameters(
    req: Request,
    res: Response,
    next: NextFunction,
    params: ParameterMetadata[],
  ): ExtractedParameters {
    const args: unknown[] = [];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
    if (!params || !params.length) {
      return [req, res, next];
    }

    params.forEach(
      ({ type, index, parameterName, injectRoot }: ParameterMetadata) => {
        switch (type) {
          case PARAMETER_TYPE.REQUEST:
            args[index] = req;
            break;
          case PARAMETER_TYPE.NEXT:
            args[index] = next;
            break;
          case PARAMETER_TYPE.PARAMS:
            args[index] = this.getParam(
              req,
              'params',
              injectRoot,
              parameterName,
            );
            break;
          case PARAMETER_TYPE.QUERY:
            args[index] = this.getParam(
              req,
              'query',
              injectRoot,
              parameterName,
            );
            break;
          case PARAMETER_TYPE.BODY:
            args[index] = req.body;
            break;
          case PARAMETER_TYPE.HEADERS:
            args[index] = this.getParam(
              req,
              'headers',
              injectRoot,
              parameterName,
            );
            break;
          case PARAMETER_TYPE.COOKIES:
            args[index] = this.getParam(
              req,
              'cookies',
              injectRoot,
              parameterName,
            );
            break;
          case PARAMETER_TYPE.PRINCIPAL:
            args[index] = this._getPrincipal(req);
            break;
          default:
            args[index] = res;
            break; // response
        }
      },
    );

    args.push(req, res, next);
    return args;
  }

  private getParam(
    source: Request,
    paramType: 'params' | 'query' | 'headers' | 'cookies',
    injectRoot: boolean,
    name?: string | symbol,
  ): unknown {
    const key: string | undefined =
      paramType === 'headers'
        ? typeof name === 'symbol'
          ? name.toString()
          : name?.toLowerCase()
        : (name as string);

    const param: Record<string, unknown> = source[paramType] as Record<
      string,
      unknown
    >;

    if (injectRoot) {
      return param;
    }

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unnecessary-condition
    return param && key ? param[key] : undefined;
  }

  private _getPrincipal(req: express.Request): Principal | null {
    return this._getHttpContext(req).user;
  }
}
