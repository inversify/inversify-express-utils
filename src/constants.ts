const TYPE = {
    AuthProvider:  Symbol("AuthProvider"),
    Controller: Symbol("Controller"),
    HttpContext: Symbol("HttpContext")
};

const METADATA_KEY = {
    controller: "_controller",
    controllerMethod: "_controller-method",
    controllerParameter: "_controller-parameter"
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

const DEFAULT_ROUTING_ROOT_PATH = "/";

export { TYPE, METADATA_KEY, DEFAULT_ROUTING_ROOT_PATH };
