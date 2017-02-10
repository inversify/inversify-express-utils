import * as express from "express";
import { interfaces as inversifyInterfaces } from "inversify";

namespace interfaces {

    export type Middleware = (inversifyInterfaces.ServiceIdentifier<any> | express.RequestHandler);

    export interface ControllerMetadata {
        path: string;
        middleware: Middleware[];
        target: any;
    }

    export interface ControllerMethodMetadata extends ControllerMetadata {
        method: string;
        key: string;
    }

    export interface Controller {}

    export interface HandlerDecorator {
        (target: any, key: string, value: any): void;
    }

    export interface ConfigFunction {
        (app: express.Application): void;
    }

    export interface RoutingConfig {
        rootPath: string;
    }

}

export { interfaces };
