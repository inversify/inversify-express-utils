import { RouteContainer } from "./route-container";
import * as express from "express";

export function Controller(path: string, ...middleware: express.RequestHandler[]) {
    return function (target: any) {
        RouteContainer.getInstance().registerController(path, middleware, target);
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
        RouteContainer.getInstance().registerHandler(method, path, middleware, target, key);
    };
}

interface IHandlerDecorator {
    (target: any, key: string, value: any): void;
}
