import { interfaces as inversifyInterfaces } from "inversify";
import { BaseHttpController } from "./base_http_controller";
import { interfaces } from "./interfaces";
import { PARAMETER_TYPE } from "./constants";
import {
    getControllersFromContainer,
    getControllerMetadata,
    getControllerMethodMetadata,
    getControllerParameterMetadata
} from "./utils";

export function getRouteInfo(container: inversifyInterfaces.Container) {

    const raw = getRawMetadata(container);

    const info = raw.map(r => {

        const controllerId = Symbol.for(r.controllerMetadata.target.name).toString();

        const endpoints = r.methodMetadata.map(m => {

            const method = m.method.toUpperCase();
            const controllerPath = r.controllerMetadata.path;
            const actionPath = m.path;
            const paramMetadata = r.parameterMetadata[m.key] || undefined;
            let args: string[] | undefined = undefined;

            if (paramMetadata) {
                args = (r.parameterMetadata[m.key] || []).map(a => {
                    let type = "";
                    switch (a.type) {
                        case PARAMETER_TYPE.RESPONSE:
                            type = "@response";
                            break;
                        case PARAMETER_TYPE.REQUEST:
                            type = "@request";
                            break;
                        case PARAMETER_TYPE.NEXT:
                            type = "@next";
                            break;
                        case PARAMETER_TYPE.PARAMS:
                            type = "@requestParam";
                            break;
                        case PARAMETER_TYPE.QUERY:
                            type = "queryParam";
                            break;
                        case PARAMETER_TYPE.BODY:
                            type = "@requestBody";
                            break;
                        case PARAMETER_TYPE.HEADERS:
                            type = "@requestHeaders";
                            break;
                        case PARAMETER_TYPE.COOKIES:
                            type = "@cookies";
                            break;
                    }
                    return `${type} ${a.parameterName}`;
                });
            }

            const details = {
                path: `${method} ${controllerPath}${actionPath}`
            };

            if (args) {
                details["args"] = args;
            }

            return details as { path: string, args?: string[] };

        });

        return {
            controller: controllerId,
            endpoints: endpoints
        };

    });

    return info;

}

export function getRawMetadata(container: inversifyInterfaces.Container) {

    const controllers = getControllersFromContainer(container);

    const raw = controllers.map((controller) => {

        let constructor = controller.constructor;
        let controllerMetadata: interfaces.ControllerMetadata = getControllerMetadata(constructor);
        let methodMetadata: interfaces.ControllerMethodMetadata[] = getControllerMethodMetadata(constructor);
        let parameterMetadata: interfaces.ControllerParameterMetadata = getControllerParameterMetadata(constructor);

        return {
            controllerMetadata,
            methodMetadata,
            parameterMetadata
        };

    });

    return raw;

}


