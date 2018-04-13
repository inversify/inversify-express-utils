import * as express from "express";
import { inject, injectable, decorate } from "inversify";
import { interfaces } from "./interfaces";
import { TYPE, METADATA_KEY, PARAMETER_TYPE } from "./constants";

export const injectHttpContext = inject(TYPE.HttpContext);

export function controller(path: string, ...middleware: interfaces.Middleware[]) {
    return function (target: any) {

        let currentMetadata: interfaces.ControllerMetadata = {
            middleware: middleware,
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

export function all(path: string, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return httpMethod("all", path, ...middleware);
}

export function httpGet(path: string, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return httpMethod("get", path, ...middleware);
}

export function httpPost(path: string, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return httpMethod("post", path, ...middleware);
}

export function httpPut(path: string, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return httpMethod("put", path, ...middleware);
}

export function httpPatch(path: string, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return httpMethod("patch", path, ...middleware);
}

export function httpHead(path: string, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return httpMethod("head", path, ...middleware);
}

export function httpDelete(path: string, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return httpMethod("delete", path, ...middleware);
}

export function httpMethod(method: string, path: string, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return function (target: any, key: string, value: any) {

        let metadata: interfaces.ControllerMethodMetadata = {
            key,
            method,
            middleware,
            path,
            target
        };

        let metadataList: interfaces.ControllerMethodMetadata[] = [];

        if (!Reflect.hasOwnMetadata(METADATA_KEY.controllerMethod, target.constructor)) {
            Reflect.defineMetadata(METADATA_KEY.controllerMethod, metadataList, target.constructor);
        } else {
            metadataList = Reflect.getOwnMetadata(METADATA_KEY.controllerMethod, target.constructor);
        }

        metadataList.push(metadata);
    };
}

export const request: () => ParameterDecorator = paramDecoratorFactory(PARAMETER_TYPE.REQUEST);
export const response: () => ParameterDecorator = paramDecoratorFactory(PARAMETER_TYPE.RESPONSE);
export const requestParam: (paramName: string) => ParameterDecorator = paramDecoratorFactory(PARAMETER_TYPE.PARAMS);
export const queryParam: (queryParamName: string) => ParameterDecorator = paramDecoratorFactory(PARAMETER_TYPE.QUERY);
export const requestBody: () => ParameterDecorator = paramDecoratorFactory(PARAMETER_TYPE.BODY);
export const requestHeaders: (headderName: string) => ParameterDecorator = paramDecoratorFactory(PARAMETER_TYPE.HEADERS);
export const cookies: (cookieName: string) => ParameterDecorator = paramDecoratorFactory(PARAMETER_TYPE.COOKIES);
export const next: () => ParameterDecorator = paramDecoratorFactory(PARAMETER_TYPE.NEXT);

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
