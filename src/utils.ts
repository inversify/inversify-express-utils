import { interfaces as inversifyInterfaces } from "inversify";
import { METADATA_KEY, NO_CONTROLLERS_FOUND } from "./constants";
import { interfaces } from "./interfaces";
import { TYPE } from "./constants";

export function getControllersFromContainer(
    container: inversifyInterfaces.Container,
    forceControllers: boolean
) {
    if (container.isBound(TYPE.Controller)) {
        return container.getAll<interfaces.Controller>(TYPE.Controller);
    } else if (forceControllers) {
        throw new Error(NO_CONTROLLERS_FOUND);
    } else {
        return [];
    }
}

export function getControllersFromMetadata() {
    let arrayOfControllerMetadata: interfaces.ControllerMetadata[] = Reflect.getMetadata(
        METADATA_KEY.controller,
        Reflect
    ) || [];
    return arrayOfControllerMetadata.map((metadata) => metadata.target);
}

export function getControllerMetadata(constructor: any) {
    let controllerMetadata: interfaces.ControllerMetadata = Reflect.getOwnMetadata(
        METADATA_KEY.controller,
        constructor
    );
    return controllerMetadata;
}

export function getControllerMethodMetadata(constructor: any) {
    let methodMetadata: interfaces.ControllerMethodMetadata[] = Reflect.getOwnMetadata(
        METADATA_KEY.controllerMethod,
        constructor
    );
    let genericMetadata = Reflect.getMetadata(
        METADATA_KEY.controllerMethod,
        Reflect.getPrototypeOf(constructor)
    );
    if (genericMetadata !== undefined && methodMetadata !== undefined) {
        return methodMetadata.concat(genericMetadata);
    } else if (genericMetadata !== undefined) {
        return genericMetadata;
    } else {
        return methodMetadata;
    }
}

export function getControllerParameterMetadata(constructor: any) {
    let parameterMetadata: interfaces.ControllerParameterMetadata = Reflect.getOwnMetadata(
        METADATA_KEY.controllerParameter,
        constructor
    );
    let genericMetadata: interfaces.ControllerParameterMetadata = Reflect.getMetadata(
        METADATA_KEY.controllerParameter,
        Reflect.getPrototypeOf(constructor)
    );
    if (genericMetadata !== undefined && parameterMetadata !== undefined) {
        return {...parameterMetadata, ...genericMetadata};
    } else if (genericMetadata !== undefined) {
        return genericMetadata;
    } else {
        return parameterMetadata;
    }
}

export function cleanUpMetadata() {
    Reflect.defineMetadata(
        METADATA_KEY.controller,
        [],
        Reflect
    );
}

export function instanceOfIHttpActionResult(value: any): value is interfaces.IHttpActionResult {
    return value != null && typeof value.executeAsync === "function";
}
