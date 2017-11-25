const TYPE = {
    AuthProvider:  Symbol("AuthProvider"),
    Controller: Symbol("Controller"),
    HttpContext: Symbol("HttpContext")
};

const METADATA_KEY = {
    controller: "inversify-express-utils:controller",
    controllerMethod: "inversify-express-utils:controller-method",
    controllerParameter: "inversify-express-utils:controller-parameter",
    httpContext: "inversify-express-utils:httpcontext"
};

export enum PARAMETER_TYPE {
    REQUEST,
    RESPONSE,
    PARAMS,
    QUERY,
    BODY,
    HEADERS,
    COOKIES,
    NEXT
}

export const DUPLICATED_CONTROLLER_NAME = (name: string) => `Two controllers cannot have the same name: ${name}`;

const DEFAULT_ROUTING_ROOT_PATH = "/";

export { TYPE, METADATA_KEY, DEFAULT_ROUTING_ROOT_PATH };
