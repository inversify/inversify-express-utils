import {inject, injectable, decorate} from 'inversify';
import {
    Controller,
    Middleware,
    ControllerMetadata,
    HandlerDecorator,
    ControllerMethodMetadata,
    ControllerParameterMetadata,
    ParameterMetadata,
} from './interfaces';
import {
    TYPE,
    METADATA_KEY,
    PARAMETER_TYPE,
    HTTP_VERBS_ENUM,
} from './constants';

export const injectHttpContext = inject(TYPE.HttpContext);

export function controller(path: string, ...middleware: Array<Middleware>) {
    return (target: any): void => {
        const currentMetadata: ControllerMetadata = {
            middleware,
            path,
            target,
        };

        decorate(injectable(), target);
        Reflect.defineMetadata(METADATA_KEY.controller, currentMetadata, target);

        // We need to create an array that contains the metadata of all
        // the controllers in the application, the metadata cannot be
        // attached to a controller. It needs to be attached to a global
        // We attach metadata to the Reflect object itself to avoid
        // declaring additonal globals. Also, the Reflect is avaiable
        // in both node and web browsers.
        const previousMetadata: Array<ControllerMetadata> = Reflect.getMetadata(
            METADATA_KEY.controller,
            Reflect,
        ) || [];

        const newMetadata = [currentMetadata, ...previousMetadata];

        Reflect.defineMetadata(
            METADATA_KEY.controller,
            newMetadata,
            Reflect,
        );
    };
}

export function all(path: string, ...middleware: Array<Middleware>): HandlerDecorator {
    return httpMethod('all', path, ...middleware);
}

export function httpGet(path: string, ...middleware: Array<Middleware>): HandlerDecorator {
    return httpMethod('get', path, ...middleware);
}

export function httpPost(path: string, ...middleware: Array<Middleware>): HandlerDecorator {
    return httpMethod('post', path, ...middleware);
}

export function httpPut(path: string, ...middleware: Array<Middleware>): HandlerDecorator {
    return httpMethod('put', path, ...middleware);
}

export function httpPatch(path: string, ...middleware: Array<Middleware>): HandlerDecorator {
    return httpMethod('patch', path, ...middleware);
}

export function httpHead(path: string, ...middleware: Array<Middleware>): HandlerDecorator {
    return httpMethod('head', path, ...middleware);
}

export function httpDelete(path: string, ...middleware: Array<Middleware>): HandlerDecorator {
    return httpMethod('delete', path, ...middleware);
}

export function httpMethod(
    method: keyof typeof HTTP_VERBS_ENUM,
    path: string,
    ...middleware: Array<Middleware>
): HandlerDecorator {
    return (target: any, key: string): void => {
        const metadata: ControllerMethodMetadata = {
            key,
            method,
            middleware,
            path,
            target,
        };

        let metadataList: Array<ControllerMethodMetadata> = [];

        if (!Reflect.hasOwnMetadata(METADATA_KEY.controllerMethod, target.constructor)) {
            Reflect.defineMetadata(METADATA_KEY.controllerMethod, metadataList, target.constructor);
        } else {
            metadataList = Reflect.getOwnMetadata(
                METADATA_KEY.controllerMethod,
                target.constructor,
            );
        }

        metadataList.push(metadata);
    };
}

export const request: () => ParameterDecorator = paramDecoratorFactory(PARAMETER_TYPE.REQUEST);
export const response: () => ParameterDecorator = paramDecoratorFactory(PARAMETER_TYPE.RESPONSE);
export const requestParam: (paramName?: string) => ParameterDecorator = paramDecoratorFactory(
    PARAMETER_TYPE.PARAMS,
);
export const queryParam: (queryParamName?: string) => ParameterDecorator = paramDecoratorFactory(
    PARAMETER_TYPE.QUERY,
);
export const requestBody: () => ParameterDecorator = paramDecoratorFactory(PARAMETER_TYPE.BODY);
export const requestHeaders: (headerName?: string) => ParameterDecorator = paramDecoratorFactory(
    PARAMETER_TYPE.HEADERS,
);
export const cookies: (cookieName?: string) => ParameterDecorator = paramDecoratorFactory(
    PARAMETER_TYPE.COOKIES,
);
export const next: () => ParameterDecorator = paramDecoratorFactory(PARAMETER_TYPE.NEXT);
export const principal: () => ParameterDecorator = paramDecoratorFactory(PARAMETER_TYPE.PRINCIPAL);

function paramDecoratorFactory(
    parameterType: PARAMETER_TYPE,
): (name?: string) => ParameterDecorator {
    return (name?: string): ParameterDecorator => params(parameterType, name);
}

export function params(type: PARAMETER_TYPE, parameterName?: string) {
    return (target: Controller, methodName: string | symbol, index: number): void => {
        let metadataList: ControllerParameterMetadata = {};
        let parameterMetadataList: Array<ParameterMetadata> = [];
        const parameterMetadata: ParameterMetadata = {
            index,
            injectRoot: parameterName === undefined,
            parameterName,
            type,
        };
        if (!Reflect.hasOwnMetadata(METADATA_KEY.controllerParameter, target.constructor)) {
            parameterMetadataList.unshift(parameterMetadata);
        } else {
            metadataList = Reflect.getOwnMetadata(
                METADATA_KEY.controllerParameter,
                target.constructor,
            );
            if (metadataList[methodName as string]) {
                parameterMetadataList = metadataList[methodName as string] || [];
            }
            parameterMetadataList.unshift(parameterMetadata);
        }
        metadataList[methodName as string] = parameterMetadataList;
        Reflect.defineMetadata(METADATA_KEY.controllerParameter, metadataList, target.constructor);
    };
}
