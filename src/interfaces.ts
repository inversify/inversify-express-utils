import * as express from "express";

export namespace interfaces {

  export interface ControllerMetadata {
    path: string;
    middleware: express.RequestHandler[];
    target: any;
  }

  export interface ControllerMethodMetadata extends ControllerMetadata {
    method: string;
    key: string;
  }

  export interface Controller { }

  export interface HandlerDecorator {
    (target: any, key: string, value: any): void;
  }

  export interface ConfigFunction {
    (app: express.Application): void;
  }
}
