import * as express from "express";
import { interfaces } from "./interfaces";
import { METADATA_KEY, PARAMETER_TYPE } from "./constants";

export function controller(path: string, ...middleware: interfaces.Middleware[]) {
    return function (target: any) {
        let metadata: interfaces.ControllerMetadata = {path, middleware, target};
        Reflect.defineMetadata(METADATA_KEY.controller, metadata, target);
    };
}

export function all   (path: string, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return httpMethod("all",    path, ...middleware);
}

export function httpGet   (path: string, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return httpMethod("get",    path, ...middleware);
}

export function httpPost  (path: string, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return httpMethod("post",   path, ...middleware);
}

export function httpPut   (path: string, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return httpMethod("put",    path, ...middleware);
}

export function httpPatch (path: string, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return httpMethod("patch",  path, ...middleware);
}

export function httpHead  (path: string, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return httpMethod("head",   path, ...middleware);
}

export function httpDelete(path: string, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return httpMethod("delete", path, ...middleware);
}

export function httpMethod(method: string, path: string, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return function (target: any, key: string, value: any) {
        let metadata: interfaces.ControllerMethodMetadata = {path, middleware, method, target, key};
        let metadataList: interfaces.ControllerMethodMetadata[] = [];

        if (!Reflect.hasOwnMetadata(METADATA_KEY.controllerMethod, target.constructor)) {
            Reflect.defineMetadata(METADATA_KEY.controllerMethod, metadataList, target.constructor);
        } else {
            metadataList = Reflect.getOwnMetadata(METADATA_KEY.controllerMethod, target.constructor);
        }

        metadataList.push(metadata);
    };
}

export const request = paramDecoratorFactory(PARAMETER_TYPE.REQUEST);
export const response = paramDecoratorFactory(PARAMETER_TYPE.RESPONSE);
export const requestParam = paramDecoratorFactory(PARAMETER_TYPE.PARAMS);
export const queryParam = paramDecoratorFactory(PARAMETER_TYPE.QUERY);
export const requestBody = paramDecoratorFactory(PARAMETER_TYPE.BODY);
export const requestHeaders = paramDecoratorFactory(PARAMETER_TYPE.HEADERS);
export const cookies = paramDecoratorFactory(PARAMETER_TYPE.COOKIES);
export const next = paramDecoratorFactory(PARAMETER_TYPE.NEXT);

function paramDecoratorFactory(parameterType: PARAMETER_TYPE): (name?: string) => ParameterDecorator {
    return function (name?: string): ParameterDecorator {
        name = name || "default";
        return params(parameterType, name);
    };
}

export function params(type: PARAMETER_TYPE, parameterName: string) {
    return function (target: Object, methodName: string, index: number) {

        let metadataList: interfaces.ControllerParameterMetadata = {};
        let parameterMetadataList: interfaces.ParameterMetadata[] = [];
        let parameterMetadata: interfaces.ParameterMetadata = {
            index: index,
            parameterName: parameterName,
            type: type
        };
        if (!Reflect.hasOwnMetadata(METADATA_KEY.controllerParameter, target.constructor)) {
            parameterMetadataList.unshift(parameterMetadata);
        } else {
            metadataList = Reflect.getOwnMetadata(METADATA_KEY.controllerParameter, target.constructor);
            if (metadataList.hasOwnProperty(methodName)) {
                parameterMetadataList = metadataList[methodName];
            }
            parameterMetadataList.unshift(parameterMetadata);
        }
        metadataList[methodName] = parameterMetadataList;
        Reflect.defineMetadata(METADATA_KEY.controllerParameter, metadataList, target.constructor);
    };
}
