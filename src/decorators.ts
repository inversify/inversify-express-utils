import * as express from "express";
import interfaces from "./interfaces";
import { METADATA_KEY } from "./constants";

export function Controller(path: string, ...middleware: express.RequestHandler[]) {
    return function (target: any) {
        let metadata: interfaces.ControllerMetadata = {path, middleware, target};
        Reflect.defineMetadata(METADATA_KEY.controller, metadata, target);
    };
}

export function All   (path: string, ...middleware: express.RequestHandler[]): interfaces.HandlerDecorator {
    return Method("all",    path, ...middleware);
}

export function Get   (path: string, ...middleware: express.RequestHandler[]): interfaces.HandlerDecorator {
    return Method("get",    path, ...middleware);
}

export function Post  (path: string, ...middleware: express.RequestHandler[]): interfaces.HandlerDecorator {
    return Method("post",   path, ...middleware);
}

export function Put   (path: string, ...middleware: express.RequestHandler[]): interfaces.HandlerDecorator {
    return Method("put",    path, ...middleware);
}

export function Patch (path: string, ...middleware: express.RequestHandler[]): interfaces.HandlerDecorator {
    return Method("patch",  path, ...middleware);
}

export function Head  (path: string, ...middleware: express.RequestHandler[]): interfaces.HandlerDecorator {
    return Method("head",   path, ...middleware);
}

export function Delete(path: string, ...middleware: express.RequestHandler[]): interfaces.HandlerDecorator {
    return Method("delete", path, ...middleware);
}

export function Method(method: string, path: string, ...middleware: express.RequestHandler[]): interfaces.HandlerDecorator {
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
