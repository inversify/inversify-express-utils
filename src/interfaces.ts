import * as express from "express";
import { interfaces as inversifyInterfaces } from "inversify";
import { PARAMETER_TYPE } from "./constants";

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

    export interface ControllerParameterMetadata {
        [methodName: string]: ParameterMetadata[];
    }

    export interface ParameterMetadata {
        parameterName: string;
        index: number;
        type: PARAMETER_TYPE;
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
        user: Principal;
    }

    export interface BaseMidleware {
        httpContext: HttpContext;
        handler(
            req: express.Request,
            res: express.Response,
            next: express.NextFunction
        ): void;
    }

}

export { interfaces };
