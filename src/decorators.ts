import { decorate, inject, injectable } from 'inversify';

import {
  HTTP_VERBS_ENUM,
  METADATA_KEY,
  PARAMETER_TYPE,
  TYPE,
} from './constants';
import type {
  ControllerMetadata,
  ControllerMethodMetadata,
  ControllerParameterMetadata,
  DecoratorTarget,
  HandlerDecorator,
  Middleware,
  MiddlewareMetaData,
  ParameterMetadata,
} from './interfaces';
import { getMiddlewareMetadata, getOrCreateMetadata } from './utils';

export const injectHttpContext: <T = unknown>(
  target: DecoratorTarget,
  targetKey?: string | symbol,
  indexOrPropertyDescriptor?: number | TypedPropertyDescriptor<T>,
) => void = inject(TYPE.HttpContext);

function defineMiddlewareMetadata(
  target: DecoratorTarget,
  metaDataKey: string,
  ...middleware: Middleware[]
): void {
  // We register decorated middleware meteadata in a map, e.g. { "controller": [ middleware ] }
  const middlewareMap: MiddlewareMetaData = getOrCreateMetadata(
    METADATA_KEY.middleware,
    target,
    {},
  );

  if (!(metaDataKey in middlewareMap)) {
    middlewareMap[metaDataKey] = [];
  }

  middlewareMap[metaDataKey]?.push(...middleware);
  Reflect.defineMetadata(METADATA_KEY.middleware, middlewareMap, target);
}

export function withMiddleware(...middleware: Middleware[]) {
  return function (
    target: DecoratorTarget | NewableFunction,
    methodName?: string,
  ): void {
    if (methodName !== undefined) {
      defineMiddlewareMetadata(target, methodName, ...middleware);
    } else if (isNewableFunction(target)) {
      defineMiddlewareMetadata(target.constructor, target.name, ...middleware);
    }
  };
}

function isNewableFunction(target: unknown): target is NewableFunction {
  return typeof target === 'function' && target.prototype !== undefined;
}

export function controller(path: string, ...middleware: Middleware[]) {
  return (target: NewableFunction): void => {
    // Get the list of middleware registered with @middleware() decorators
    const decoratedMiddleware: Middleware[] = getMiddlewareMetadata(
      target.constructor,
      target.name,
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
    // declaring additional globals. Also, the Reflect is available
    // in both node and web browsers.
    const previousMetadata: ControllerMetadata[] =
      (Reflect.getMetadata(METADATA_KEY.controller, Reflect) as
        | ControllerMetadata[]
        | undefined) ?? [];

    const newMetadata: ControllerMetadata[] = [
      currentMetadata,
      ...previousMetadata,
    ];

    Reflect.defineMetadata(METADATA_KEY.controller, newMetadata, Reflect);
  };
}

export function all(
  path: string,
  ...middleware: Middleware[]
): HandlerDecorator {
  return httpMethod(HTTP_VERBS_ENUM.all, path, ...middleware);
}

export function httpGet(
  path: string,
  ...middleware: Middleware[]
): HandlerDecorator {
  return httpMethod(HTTP_VERBS_ENUM.get, path, ...middleware);
}

export function httpPost(
  path: string,
  ...middleware: Middleware[]
): HandlerDecorator {
  return httpMethod(HTTP_VERBS_ENUM.post, path, ...middleware);
}

export function httpPut(
  path: string,
  ...middleware: Middleware[]
): HandlerDecorator {
  return httpMethod(HTTP_VERBS_ENUM.put, path, ...middleware);
}

export function httpPatch(
  path: string,
  ...middleware: Middleware[]
): HandlerDecorator {
  return httpMethod(HTTP_VERBS_ENUM.patch, path, ...middleware);
}

export function httpHead(
  path: string,
  ...middleware: Middleware[]
): HandlerDecorator {
  return httpMethod(HTTP_VERBS_ENUM.head, path, ...middleware);
}

export function httpDelete(
  path: string,
  ...middleware: Middleware[]
): HandlerDecorator {
  return httpMethod(HTTP_VERBS_ENUM.delete, path, ...middleware);
}

export function httpOptions(
  path: string,
  ...middleware: Middleware[]
): HandlerDecorator {
  return httpMethod(HTTP_VERBS_ENUM.options, path, ...middleware);
}

export function httpMethod(
  method: HTTP_VERBS_ENUM,
  path: string,
  ...middleware: Middleware[]
): HandlerDecorator {
  return (target: DecoratorTarget, key: string): void => {
    const decoratedMiddleware: Middleware[] = getMiddlewareMetadata(
      target,
      key,
    );

    const metadata: ControllerMethodMetadata = {
      key,
      method,
      middleware: middleware.concat(decoratedMiddleware),
      path,
      target,
    };

    let metadataList: ControllerMethodMetadata[] = [];

    if (
      !Reflect.hasOwnMetadata(METADATA_KEY.controllerMethod, target.constructor)
    ) {
      Reflect.defineMetadata(
        METADATA_KEY.controllerMethod,
        metadataList,
        target.constructor,
      );
    } else {
      metadataList = Reflect.getOwnMetadata(
        METADATA_KEY.controllerMethod,
        target.constructor,
      ) as ControllerMethodMetadata[];
    }

    metadataList.push(metadata);
  };
}

export const request: () => ParameterDecorator = paramDecoratorFactory(
  PARAMETER_TYPE.REQUEST,
);

export const response: () => ParameterDecorator = paramDecoratorFactory(
  PARAMETER_TYPE.RESPONSE,
);

export const requestParam: (paramName?: string) => ParameterDecorator =
  paramDecoratorFactory(PARAMETER_TYPE.PARAMS);

export const queryParam: (queryParamName?: string) => ParameterDecorator =
  paramDecoratorFactory(PARAMETER_TYPE.QUERY);

export const requestBody: () => ParameterDecorator = paramDecoratorFactory(
  PARAMETER_TYPE.BODY,
);

export const requestHeaders: (headerName?: string) => ParameterDecorator =
  paramDecoratorFactory(PARAMETER_TYPE.HEADERS);

export const cookies: (cookieName?: string) => ParameterDecorator =
  paramDecoratorFactory(PARAMETER_TYPE.COOKIES);

export const next: () => ParameterDecorator = paramDecoratorFactory(
  PARAMETER_TYPE.NEXT,
);

export const principal: () => ParameterDecorator = paramDecoratorFactory(
  PARAMETER_TYPE.PRINCIPAL,
);

function paramDecoratorFactory(
  parameterType: PARAMETER_TYPE,
): (name?: string | symbol) => ParameterDecorator {
  return (name?: string | symbol): ParameterDecorator =>
    params(parameterType, name);
}

export function params(type: PARAMETER_TYPE, parameterName?: string | symbol) {
  return (
    target: object,
    methodName: string | symbol | undefined,
    index: number,
  ): void => {
    let metadataList: ControllerParameterMetadata = {};
    let parameterMetadataList: ParameterMetadata[] = [];
    const parameterMetadata: ParameterMetadata = {
      index,
      injectRoot: parameterName === undefined,
      parameterName,
      type,
    };
    if (
      !Reflect.hasOwnMetadata(
        METADATA_KEY.controllerParameter,
        target.constructor,
      )
    ) {
      parameterMetadataList.unshift(parameterMetadata);
    } else {
      metadataList = Reflect.getOwnMetadata(
        METADATA_KEY.controllerParameter,
        target.constructor,
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
      target.constructor,
    );
  };
}
