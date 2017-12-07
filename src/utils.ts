import { interfaces as inversifyInterfaces } from "inversify";
import { METADATA_KEY } from "./constants";
import { interfaces } from "./interfaces";
import { TYPE } from "./constants";

export function getControllersFromContainer(container: inversifyInterfaces.Container) {
    return container.getAll<interfaces.Controller>(TYPE.Controller);
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
    return methodMetadata;
}

export function getControllerParameterMetadata(constructor: any) {
    let parameterMetadata: interfaces.ControllerParameterMetadata = Reflect.getOwnMetadata(
        METADATA_KEY.controllerParameter,
        constructor
    );
    return parameterMetadata;
}

export function cleanUpMetadata() {
    Reflect.defineMetadata(
        METADATA_KEY.controller,
        [],
        Reflect
    );
}
