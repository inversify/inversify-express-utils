import * as express from "express";
import { IControllerMetadata, IControllerMethodMetadata } from "./interfaces";

export function Controller(path: string, ...middleware: express.RequestHandler[]) {
    return function (target: any) {
        let metadata: IControllerMetadata = {path, middleware, target};
        Reflect.defineMetadata("_controller", metadata, target);
    };
}

export function All   (path: string, ...middleware: express.RequestHandler[]): IHandlerDecorator {
    return Method("all",    path, ...middleware);
}
export function Get   (path: string, ...middleware: express.RequestHandler[]): IHandlerDecorator {
    return Method("get",    path, ...middleware);
}
export function Post  (path: string, ...middleware: express.RequestHandler[]): IHandlerDecorator {
    return Method("post",   path, ...middleware);
}
export function Put   (path: string, ...middleware: express.RequestHandler[]): IHandlerDecorator {
    return Method("put",    path, ...middleware);
}
export function Patch (path: string, ...middleware: express.RequestHandler[]): IHandlerDecorator {
    return Method("patch",  path, ...middleware);
}
export function Head  (path: string, ...middleware: express.RequestHandler[]): IHandlerDecorator {
    return Method("head",   path, ...middleware);
}
export function Delete(path: string, ...middleware: express.RequestHandler[]): IHandlerDecorator {
    return Method("delete", path, ...middleware);
}

export function Method(method: string, path: string, ...middleware: express.RequestHandler[]): IHandlerDecorator {
    return function (target: any, key: string, value: any) {
        let metadata: IControllerMethodMetadata = {path, middleware, method, target, key};
        let metadataList: IControllerMethodMetadata[] = [];

        if (!Reflect.hasOwnMetadata("_controller-method", target.constructor)) {
            Reflect.defineMetadata("_controller-method", metadataList, target.constructor);
        } else {
            metadataList = Reflect.getOwnMetadata("_controller-method", target.constructor);
        }

        metadataList.push(metadata);
        console.log(metadataList.map((metadata: any) => metadata.key));
    };
}

interface IHandlerDecorator {
    (target: any, key: string, value: any): void;
}
