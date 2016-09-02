import * as express from "express";

namespace interfaces {

    export interface ControllerMetadata {
        path: string;
        middleware: express.Handler[];
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

}

export default interfaces;
