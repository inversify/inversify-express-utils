import {interfaces} from 'inversify';
import {
    Controller,
    ControllerMetadata,
    ControllerMethodMetadata,
    ControllerParameterMetadata,
    DecoratorTarget,
    IHttpActionResult,
} from './interfaces';
import {METADATA_KEY, NO_CONTROLLERS_FOUND, TYPE} from './constants';

export function getControllersFromContainer(
    container: interfaces.Container,
    forceControllers: boolean,
): Array<Controller> {
    if (container.isBound(TYPE.Controller)) {
        return container.getAll<Controller>(TYPE.Controller);
    } if (forceControllers) {
        throw new Error(NO_CONTROLLERS_FOUND);
    } else {
        return [];
    }
}

export function getControllersFromMetadata(): Array<DecoratorTarget> {
    const arrayOfControllerMetadata: Array<ControllerMetadata> = Reflect.getMetadata(
        METADATA_KEY.controller,
        Reflect,
    ) || [];
    return arrayOfControllerMetadata.map(metadata => metadata.target);
}

export function getControllerMetadata(constructor: NewableFunction): ControllerMetadata {
    const controllerMetadata: ControllerMetadata = Reflect.getOwnMetadata(
        METADATA_KEY.controller,
        constructor,
    );
    return controllerMetadata;
}

export function getControllerMethodMetadata(
    constructor: NewableFunction,
): Array<ControllerMethodMetadata> {
    const methodMetadata: Array<ControllerMethodMetadata> = Reflect.getOwnMetadata(
        METADATA_KEY.controllerMethod,
        constructor,
    );
    const genericMetadata = Reflect.getMetadata(
        METADATA_KEY.controllerMethod,
        Reflect.getPrototypeOf(constructor) as NewableFunction,
    );
    if (genericMetadata !== undefined && methodMetadata !== undefined) {
        return methodMetadata.concat(genericMetadata);
    } if (genericMetadata !== undefined) {
        return genericMetadata;
    }
    return methodMetadata;
}

export function getControllerParameterMetadata(
    constructor: NewableFunction,
): ControllerParameterMetadata {
    const parameterMetadata: ControllerParameterMetadata = Reflect.getOwnMetadata(
        METADATA_KEY.controllerParameter,
        constructor,
    );
    const genericMetadata: ControllerParameterMetadata = Reflect.getMetadata(
        METADATA_KEY.controllerParameter,
        Reflect.getPrototypeOf(constructor) as NewableFunction,
    );
    if (genericMetadata !== undefined && parameterMetadata !== undefined) {
        return {...parameterMetadata, ...genericMetadata};
    } if (genericMetadata !== undefined) {
        return genericMetadata;
    }
    return parameterMetadata;
}

export function cleanUpMetadata(): void {
    Reflect.defineMetadata(
        METADATA_KEY.controller,
        [],
        Reflect,
    );
}

export function instanceOfIHttpActionResult(value: unknown): value is IHttpActionResult {
    return value != null && typeof (value as IHttpActionResult).executeAsync === 'function';
}
