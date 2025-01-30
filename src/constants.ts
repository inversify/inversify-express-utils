/* eslint-disable @typescript-eslint/typedef */
/* eslint-disable @typescript-eslint/naming-convention */
export const TYPE = {
  AuthProvider: Symbol.for('AuthProvider'),
  Controller: Symbol.for('Controller'),
  HttpContext: Symbol.for('HttpContext'),
};

export const METADATA_KEY = {
  controller: 'inversify-express-utils:controller',
  controllerMethod: 'inversify-express-utils:controller-method',
  controllerParameter: 'inversify-express-utils:controller-parameter',
  httpContext: 'inversify-express-utils:httpcontext',
  middleware: 'inversify-express-utils:middleware',
};

export enum PARAMETER_TYPE {
  REQUEST,
  RESPONSE,
  PARAMS,
  QUERY,
  BODY,
  HEADERS,
  COOKIES,
  NEXT,
  PRINCIPAL,
}

export enum HTTP_VERBS_ENUM {
  all = 'all',
  connect = 'connect',
  delete = 'delete',
  get = 'get',
  head = 'head',
  options = 'options',
  patch = 'patch',
  post = 'post',
  propfind = 'propfind',
  put = 'put',
  trace = 'trace',
}

export const DUPLICATED_CONTROLLER_NAME: (name: string) => string = (
  name: string,
): string => `Two controllers cannot have the same name: ${name}`;

export const NO_CONTROLLERS_FOUND: string =
  'No controllers have been found! Please ensure that you have register at least one Controller.';

export const DEFAULT_ROUTING_ROOT_PATH: string = '/';
