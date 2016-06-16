import * as express from "express";

export interface IControllerMetadata {
    path: string;
    middleware: express.RequestHandler[];
    target: any;
}

export interface IControllerMethodMetadata extends IControllerMetadata {
    method: string;
    key: string;
}

export interface IController {}
