import * as express from "express";
import { interfaces as inversifyInterfaces } from "inversify";
import { HTTP_VERBS_ENUM, PARAMETER_TYPE } from "./constants";
import { HttpResponseMessage } from "./httpResponseMessage";

namespace interfaces {

    export type Middleware = (inversifyInterfaces.ServiceIdentifier<any> | express.RequestHandler);

    export interface ControllerMetadata {
        path: string;
        middleware: Middleware[];
        target: any;
    }

    export interface ControllerMethodMetadata extends ControllerMetadata {
        method: keyof typeof HTTP_VERBS_ENUM;
        key: string;
    }

    export interface ControllerParameterMetadata {
        [methodName: string]: ParameterMetadata[];
    }

    export interface ParameterMetadata {
        parameterName?: string;
        injectRoot: boolean;
        index: number;
        type: PARAMETER_TYPE;
    }

    export interface Controller { }

    export interface HandlerDecorator {
        (target: any, key: string, value: any): void;
    }

    export interface ConfigFunction {
        (app: express.Application): void;
    }

    export interface RoutingConfig {
        rootPath: string;
    }

    export interface Principal {
        details: any;
        isAuthenticated(): Promise<boolean>;
        // Allows content-based auth
        isResourceOwner(resourceId: any): Promise<boolean>;
        // Allows role-based auth
        isInRole(role: string): Promise<boolean>;
    }

    export interface AuthProvider {
        getUser(
            req: express.Request,
            res: express.Response,
            next: express.NextFunction
        ): Promise<Principal>;
    }

    export interface HttpContext {
        request: express.Request;
        response: express.Response;
        container: inversifyInterfaces.Container;
        user: Principal;
    }

    export interface IHttpActionResult {
        executeAsync(): Promise<HttpResponseMessage>;
    }

    export interface RouteDetails {
        route: string;
        args?: string[];
    }

    export interface RouteInfo {
        controller: any;
        endpoints: RouteDetails[];
    }
}

export { interfaces };
