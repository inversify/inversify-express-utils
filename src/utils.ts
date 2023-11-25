import { interfaces } from 'inversify';
import { METADATA_KEY, NO_CONTROLLERS_FOUND, TYPE } from './constants';
import type { Controller, ControllerMetadata, ControllerMethodMetadata, ControllerParameterMetadata, DecoratorTarget, IHttpActionResult, Middleware, MiddlewareMetaData } from './interfaces';

export function getControllersFromContainer(
  container: interfaces.Container,
  forceControllers: boolean,
): Controller[] {
  if (container.isBound(TYPE.Controller)) {
    return container.getAll<Controller>(TYPE.Controller);
  } if (forceControllers) {
    throw new Error(NO_CONTROLLERS_FOUND);
  } else {
    return [];
  }
}

export function getControllersFromMetadata(): DecoratorTarget[] {
  const arrayOfControllerMetadata: ControllerMetadata[] =
    Reflect.getMetadata(
      METADATA_KEY.controller,
      Reflect,
    ) as ControllerMetadata[] || [];
  return arrayOfControllerMetadata.map(metadata => metadata.target);
}

export function getMiddlewareMetadata(constructor: DecoratorTarget, key: string)
  : Middleware[] {
  const middlewareMetadata = Reflect.getMetadata(
    METADATA_KEY.middleware,
    constructor
  ) as MiddlewareMetaData || {};
  return middlewareMetadata[key] || [];
}

export function getControllerMetadata(
  constructor: NewableFunction
): ControllerMetadata {
  const controllerMetadata: ControllerMetadata = Reflect.getMetadata(
    METADATA_KEY.controller,
    constructor,
  ) as ControllerMetadata;
  return controllerMetadata;
}

export function getControllerMethodMetadata(
  constructor: NewableFunction,
): ControllerMethodMetadata[] {
  const methodMetadata = Reflect.getOwnMetadata(
    METADATA_KEY.controllerMethod,
    constructor,
  ) as ControllerMethodMetadata[];

  const genericMetadata = Reflect.getMetadata(
    METADATA_KEY.controllerMethod,
    Reflect.getPrototypeOf(constructor) as NewableFunction,
  ) as ControllerMethodMetadata[];

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
  ) as ControllerParameterMetadata;

  const genericMetadata: ControllerParameterMetadata = Reflect.getMetadata(
    METADATA_KEY.controllerParameter,
    Reflect.getPrototypeOf(constructor) as NewableFunction,
  ) as ControllerParameterMetadata;

  if (genericMetadata !== undefined && parameterMetadata !== undefined) {
    return { ...parameterMetadata, ...genericMetadata };
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

export function instanceOfIHttpActionResult(
  value: unknown
): value is IHttpActionResult {
  return value != null &&
    typeof (value as IHttpActionResult).executeAsync === 'function';
}

export function getOrCreateMetadata<T>(
  key: string,
  target: object,
  defaultValue: T
): T {
  if (!Reflect.hasMetadata(key, target)) {
    Reflect.defineMetadata(key, defaultValue, target);
    return defaultValue;
  }

  return Reflect.getMetadata(key, target) as T;
}
