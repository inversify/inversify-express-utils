import { getKernel } from './kernel';
import { getContainer } from './route-container';
import * as express from 'express';

export function Controller(path: string, ...middleware: express.RequestHandler[]) {
    return function (target: any) {
        getContainer().registerController(path, middleware, target);
    }
}

export function All   (path: string, ...middleware: express.RequestHandler[]) { return Method('all',    path, ...middleware); }
export function Get   (path: string, ...middleware: express.RequestHandler[]) { return Method('get',    path, ...middleware); }
export function Post  (path: string, ...middleware: express.RequestHandler[]) { return Method('post',   path, ...middleware); }
export function Put   (path: string, ...middleware: express.RequestHandler[]) { return Method('put',    path, ...middleware); }
export function Patch (path: string, ...middleware: express.RequestHandler[]) { return Method('patch',  path, ...middleware); }
export function Head  (path: string, ...middleware: express.RequestHandler[]) { return Method('head',   path, ...middleware); }
export function Delete(path: string, ...middleware: express.RequestHandler[]) { return Method('delete', path, ...middleware); }

export function Method(method: string, path: string, ...middleware: express.RequestHandler[]) {
    return function (target: any, key: string, value: any) {
        
        var handler: express.RequestHandler = (req: express.Request, res: express.Response, next: any) => {
            var result = getKernel().get(target.constructor.name)[key](req, res, next);
            if (result || !res.headersSent) res.send(result);
        };
        
        getContainer().registerHandler(method, path, target, middleware, handler);
    }
}