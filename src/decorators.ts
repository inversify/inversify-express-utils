import * as express from "express";
import { interfaces } from "./interfaces";
import { METADATA_KEY, PARAMETER_TYPE } from "./constants";

export function Controller(path: string, ...middleware: interfaces.Middleware[]) {
    return function (target: any) {
        let metadata: interfaces.ControllerMetadata = {path, middleware, target};
        Reflect.defineMetadata(METADATA_KEY.controller, metadata, target);
    };
}

export function All   (path: string, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return Method("all",    path, ...middleware);
}

export function Get   (path: string, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return Method("get",    path, ...middleware);
}

export function Post  (path: string, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return Method("post",   path, ...middleware);
}

export function Put   (path: string, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return Method("put",    path, ...middleware);
}

export function Patch (path: string, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return Method("patch",  path, ...middleware);
}

export function Head  (path: string, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return Method("head",   path, ...middleware);
}

export function Delete(path: string, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
    return Method("delete", path, ...middleware);
}

export function Method(method: string, path: string, ...middleware: interfaces.Middleware[]): interfaces.HandlerDecorator {
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

export const Request = paramDecoratorFactory(PARAMETER_TYPE.REQUEST);
export const Response = paramDecoratorFactory(PARAMETER_TYPE.RESPONSE);
export const RequestParam = paramDecoratorFactory(PARAMETER_TYPE.PARAMS);
export const QueryParam = paramDecoratorFactory(PARAMETER_TYPE.QUERY);
export const RequestBody = paramDecoratorFactory(PARAMETER_TYPE.BODY);
export const RequestHeaders = paramDecoratorFactory(PARAMETER_TYPE.HEADERS);
export const Cookies = paramDecoratorFactory(PARAMETER_TYPE.COOKIES);
export const Next = paramDecoratorFactory(PARAMETER_TYPE.NEXT);

function paramDecoratorFactory(parameterType: PARAMETER_TYPE): (name?: string) => ParameterDecorator {
    return function (name?: string): ParameterDecorator {
        name = name || "default";
        return Params(parameterType, name);
    };
}

export function Params(type: PARAMETER_TYPE, parameterName: string) {
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
