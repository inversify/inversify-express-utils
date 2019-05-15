import { inject, injectable, decorate } from "inversify";
import { interfaces } from "./interfaces";
import { TYPE, METADATA_KEY, PARAMETER_TYPE } from "./constants";
import { getOrCreateMetadata } from "./utils";

export const injectHttpContext = inject(TYPE.HttpContext);

export function controller(path: string, ...middlewares: interfaces.Middleware[]) {
    return function (target: any) {

        let currentMetadata: interfaces.ControllerMetadata = {
            middleware: middlewares,
            path: path,
            target: target
        };

        decorate(injectable(), target);
        Reflect.defineMetadata(METADATA_KEY.controller, currentMetadata, target);

        // We need to create an array that contains the metadata of all
        // the controllers in the application, the metadata cannot be
        // attached to a controller. It needs to be attached to a global
        // We attach metadata to the Reflect object itself to avoid
        // declaring additonal globals. Also, the Reflect is avaiable
        // in both node and web browsers.
        const previousMetadata: interfaces.ControllerMetadata[] = Reflect.getMetadata(
            METADATA_KEY.controller,
            Reflect
        ) || [];

        const newMetadata = [currentMetadata, ...previousMetadata];

        Reflect.defineMetadata(
            METADATA_KEY.controller,
            newMetadata,
            Reflect
        );

    };
}

export function all(path: string, ...middlewares: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return httpMethod("all", path, ...middlewares);
}

export function httpGet(path: string, ...middlewares: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return httpMethod("get", path, ...middlewares);
}

export function httpPost(path: string, ...middlewares: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return httpMethod("post", path, ...middlewares);
}

export function httpPut(path: string, ...middlewares: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return httpMethod("put", path, ...middlewares);
}

export function httpPatch(path: string, ...middlewares: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return httpMethod("patch", path, ...middlewares);
}

export function httpHead(path: string, ...middlewares: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return httpMethod("head", path, ...middlewares);
}

export function httpDelete(path: string, ...middlewares: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return httpMethod("delete", path, ...middlewares);
}

export function httpMethod(method: string, path: string, ...middlewares: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return function (target: any, key: string, value: any) {

        let metadata: interfaces.ControllerMethodMetadata = {
            key,
            method,
            path,
            target
        };

        let metadataList: interfaces.ControllerMethodMetadata[] = getOrCreateMetadata(
            METADATA_KEY.controllerMethod,
            target.constructor,
            () => []
        );

        metadataList.push(metadata);

        middleware(...middlewares)(target, key);
    };
}

export function middleware(...fns: interfaces.Middleware[]) {
    return function (target: any, methodName: string) {
        let controllerMiddlewareMap = getOrCreateMetadata(
            METADATA_KEY.controllerMethodMiddleware,
            target.constructor,
            () => new Map<string, interfaces.Middleware[]>()
        );

        let controllerMiddleware = controllerMiddlewareMap.get(methodName);

        if (controllerMiddleware) {
            controllerMiddleware.push(...fns);
        } else {
            controllerMiddlewareMap.set(methodName, fns);
        }
    };
}

export const request: () => ParameterDecorator = paramDecoratorFactory(PARAMETER_TYPE.REQUEST);
export const response: () => ParameterDecorator = paramDecoratorFactory(PARAMETER_TYPE.RESPONSE);
export const requestParam: (paramName?: string) => ParameterDecorator = paramDecoratorFactory(PARAMETER_TYPE.PARAMS);
export const queryParam: (queryParamName?: string) => ParameterDecorator = paramDecoratorFactory(PARAMETER_TYPE.QUERY);
export const requestBody: () => ParameterDecorator = paramDecoratorFactory(PARAMETER_TYPE.BODY);
export const requestHeaders: (headerName?: string) => ParameterDecorator = paramDecoratorFactory(PARAMETER_TYPE.HEADERS);
export const cookies: (cookieName?: string) => ParameterDecorator = paramDecoratorFactory(PARAMETER_TYPE.COOKIES);
export const next: () => ParameterDecorator = paramDecoratorFactory(PARAMETER_TYPE.NEXT);
export const principal: () => ParameterDecorator = paramDecoratorFactory(PARAMETER_TYPE.PRINCIPAL);

function paramDecoratorFactory(parameterType: PARAMETER_TYPE): (name?: string) => ParameterDecorator {
    return function (name?: string): ParameterDecorator {
        return params(parameterType, name);
    };
}

export function params(type: PARAMETER_TYPE, parameterName?: string) {
    return function (target: Object, methodName: string, index: number) {

        let metadataList: interfaces.ControllerParameterMetadata = {};
        let parameterMetadataList: interfaces.ParameterMetadata[] = [];
        let parameterMetadata: interfaces.ParameterMetadata = {
            index: index,
            injectRoot: parameterName === undefined,
            parameterName: parameterName,
            type: type
        };
        if (!Reflect.hasMetadata(METADATA_KEY.controllerParameter, target.constructor)) {
            parameterMetadataList.unshift(parameterMetadata);
        } else {
            metadataList = Reflect.getMetadata(METADATA_KEY.controllerParameter, target.constructor);
            if (metadataList.hasOwnProperty(methodName)) {
                parameterMetadataList = metadataList[methodName];
            }
            parameterMetadataList.unshift(parameterMetadata);
        }
        metadataList[methodName] = parameterMetadataList;
        Reflect.defineMetadata(METADATA_KEY.controllerParameter, metadataList, target.constructor);
    };
}
