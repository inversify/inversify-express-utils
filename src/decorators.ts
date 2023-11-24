import { inject, injectable, decorate } from 'inversify';
import { TYPE, METADATA_KEY, PARAMETER_TYPE, HTTP_VERBS_ENUM, } from './constants';
import type { Controller, DecoratorTarget, Middleware, ControllerMetadata, HandlerDecorator, ControllerMethodMetadata, ControllerParameterMetadata, ParameterMetadata, MiddlewareMetaData } from './interfaces';
import { getMiddlewareMetadata, getOrCreateMetadata } from './utils';

export const injectHttpContext = inject(TYPE.HttpContext);

function defineMiddlewareMetadata(
  target: DecoratorTarget,
  metaDataKey: string,
  ...middleware: Array<Middleware>
): void {
  // We register decorated middleware meteadata in a map, e.g. { "controller": [ middleware ] }
  const middlewareMap: MiddlewareMetaData = getOrCreateMetadata(
      METADATA_KEY.middleware, target,
      { },
  );

  if (!(metaDataKey in middlewareMap)) {
      middlewareMap[metaDataKey] = [];
  }

  middlewareMap[metaDataKey]?.push(...middleware);
  Reflect.defineMetadata(METADATA_KEY.middleware, middlewareMap, target);
}

export function withMiddleware(...middleware: Array<Middleware>) {
  return function (
    target: DecoratorTarget | NewableFunction,
    methodName?: string
  ): void {
      if (methodName) {
          defineMiddlewareMetadata(target, methodName, ...middleware);
      } else if (isNewableFunction(target)) {
          defineMiddlewareMetadata(
            target.constructor,
            target.name,
            ...middleware
          );
      }
  };
}

function isNewableFunction(target: unknown): target is NewableFunction {
  return typeof target === 'function' && target.prototype !== undefined;
}

export function controller(path: string, ...middleware: Array<Middleware>) {
  return (target: NewableFunction): void => {
    // Get the list of middleware registered with @middleware() decorators
    const decoratedMiddleware = getMiddlewareMetadata(
      target.constructor,
      target.name
    );

    const currentMetadata: ControllerMetadata = {
      middleware: middleware.concat(decoratedMiddleware),
      path,
      target,
    };

    decorate(injectable(), target);
    Reflect.defineMetadata(METADATA_KEY.controller, currentMetadata, target);

    // We need to create an array that contains the metadata of all
    // the controllers in the application, the metadata cannot be
    // attached to a controller. It needs to be attached to a global
    // We attach metadata to the Reflect object itself to avoid
    // declaring additonal globals. Also, the Reflect is avaiable
    // in both node and web browsers.
    const previousMetadata: Array<ControllerMetadata> = Reflect.getMetadata(
      METADATA_KEY.controller,
      Reflect,
    ) as Array<ControllerMetadata> || [];

    const newMetadata = [currentMetadata, ...previousMetadata];

    Reflect.defineMetadata(
      METADATA_KEY.controller,
      newMetadata,
      Reflect,
    );
  };
}

export function all(
  path: string,
  ...middleware: Array<Middleware>
): HandlerDecorator {
  return httpMethod('all', path, ...middleware);
}

export function httpGet(
  path: string,
  ...middleware: Array<Middleware>
): HandlerDecorator {
  return httpMethod('get', path, ...middleware);
}

export function httpPost(
  path: string,
  ...middleware: Array<Middleware>
): HandlerDecorator {
  return httpMethod('post', path, ...middleware);
}

export function httpPut(
  path: string,
  ...middleware: Array<Middleware>
): HandlerDecorator {
  return httpMethod('put', path, ...middleware);
}

export function httpPatch(
  path: string,
  ...middleware: Array<Middleware>
): HandlerDecorator {
  return httpMethod('patch', path, ...middleware);
}

export function httpHead(
  path: string,
  ...middleware: Array<Middleware>
): HandlerDecorator {
  return httpMethod('head', path, ...middleware);
}

export function httpDelete(
  path: string,
  ...middleware: Array<Middleware>
): HandlerDecorator {
  return httpMethod('delete', path, ...middleware);
}

export function httpMethod(
  method: keyof typeof HTTP_VERBS_ENUM,
  path: string,
  ...middleware: Array<Middleware>
): HandlerDecorator {
  return (target: DecoratorTarget, key: string): void => {
    const decoratedMiddleware = getMiddlewareMetadata(target, key);

    const metadata: ControllerMethodMetadata = {
      key,
      method,
      middleware: middleware.concat(decoratedMiddleware),
      path,
      target,
    };

    // const metadataList = getOrCreateMetadata<Array<ControllerMethodMetadata>>(
    //     METADATA_KEY.controllerMethod,
    //     target.constructor,
    //     [],
    // );

    let metadataList: Array<ControllerMethodMetadata> = [];

    if (
      !Reflect.hasOwnMetadata(
        METADATA_KEY.controllerMethod,
        target.constructor
      )
    ) {
      Reflect.defineMetadata(
        METADATA_KEY.controllerMethod,
        metadataList,
        target.constructor
      );
    } else {
      metadataList = Reflect.getOwnMetadata(
        METADATA_KEY.controllerMethod,
        target.constructor,
      ) as Array<ControllerMethodMetadata>;
    }

    metadataList.push(metadata);
  };
}

export const request: () => ParameterDecorator =
  paramDecoratorFactory(PARAMETER_TYPE.REQUEST);

export const response: () => ParameterDecorator =
  paramDecoratorFactory(PARAMETER_TYPE.RESPONSE);

export const requestParam: (paramName?: string) => ParameterDecorator =
  paramDecoratorFactory(
    PARAMETER_TYPE.PARAMS
  );

export const queryParam: (queryParamName?: string) => ParameterDecorator =
  paramDecoratorFactory(
    PARAMETER_TYPE.QUERY
  );

export const requestBody: () => ParameterDecorator =
  paramDecoratorFactory(PARAMETER_TYPE.BODY);

export const requestHeaders: (headerName?: string) => ParameterDecorator =
  paramDecoratorFactory(
    PARAMETER_TYPE.HEADERS
  );

export const cookies: (cookieName?: string) => ParameterDecorator =
  paramDecoratorFactory(
    PARAMETER_TYPE.COOKIES
  );

export const next: () => ParameterDecorator =
  paramDecoratorFactory(PARAMETER_TYPE.NEXT);

export const principal: () => ParameterDecorator =
  paramDecoratorFactory(PARAMETER_TYPE.PRINCIPAL);

function paramDecoratorFactory(
  parameterType: PARAMETER_TYPE,
): (name?: string) => ParameterDecorator {
  return (name?: string): ParameterDecorator =>
    params(parameterType, name);
}

export function params(type: PARAMETER_TYPE, parameterName?: string) {
  return (
    target: unknown | Controller,
    methodName: string | symbol,
    index: number
  ): void => {
    let metadataList: ControllerParameterMetadata = {};
    let parameterMetadataList: Array<ParameterMetadata> = [];
    const parameterMetadata: ParameterMetadata = {
      index,
      injectRoot: parameterName === undefined,
      parameterName,
      type,
    };
    if (
      !Reflect.hasOwnMetadata(
        METADATA_KEY.controllerParameter,
        (target as Controller).constructor
      )
    ) {
      parameterMetadataList.unshift(parameterMetadata);
    } else {
      metadataList = Reflect.getOwnMetadata(
        METADATA_KEY.controllerParameter,
        (target as Controller).constructor,
      ) as ControllerParameterMetadata;
      if (metadataList[methodName as string]) {
        parameterMetadataList = metadataList[methodName as string] || [];
      }
      parameterMetadataList.unshift(parameterMetadata);
    }
    metadataList[methodName as string] = parameterMetadataList;
    Reflect.defineMetadata(
      METADATA_KEY.controllerParameter,
      metadataList,
      (target as Controller).constructor
    );
  };
}
