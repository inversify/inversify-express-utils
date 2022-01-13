import {interfaces as inversifyInterfaces} from 'inversify';
import {PARAMETER_TYPE} from './constants';
import {RouteDetails, RouteInfo, RawMetadata} from './interfaces';
import {
    getControllersFromContainer,
    getControllerMetadata,
    getControllerMethodMetadata,
    getControllerParameterMetadata,
} from './utils';

export function getRouteInfo(
    container: inversifyInterfaces.Container,
): Array<RouteInfo> {
    const raw = getRawMetadata(container);

    return raw.map(r => {
        const controllerId = (r.controllerMetadata.target as {name:string}).name;

        const endpoints = r.methodMetadata.map(m => {
            const method = m.method.toUpperCase();
            const controllerPath = r.controllerMetadata.path;
            const actionPath = m.path;
            const paramMetadata = r.parameterMetadata;
            let args: Array<string> | undefined;

            if (paramMetadata !== undefined) {
                const paramMetadataForKey = paramMetadata[m.key] || undefined;
                if (paramMetadataForKey) {
                    args = (r.parameterMetadata[m.key] || []).map(a => {
                        let type = '';
                        switch (a.type) {
                            case PARAMETER_TYPE.RESPONSE:
                                type = '@response';
                                break;
                            case PARAMETER_TYPE.REQUEST:
                                type = '@request';
                                break;
                            case PARAMETER_TYPE.NEXT:
                                type = '@next';
                                break;
                            case PARAMETER_TYPE.PARAMS:
                                type = '@requestParam';
                                break;
                            case PARAMETER_TYPE.QUERY:
                                type = 'queryParam';
                                break;
                            case PARAMETER_TYPE.BODY:
                                type = '@requestBody';
                                break;
                            case PARAMETER_TYPE.HEADERS:
                                type = '@requestHeaders';
                                break;
                            case PARAMETER_TYPE.COOKIES:
                                type = '@cookies';
                                break;
                            case PARAMETER_TYPE.PRINCIPAL:
                                type = '@principal';
                                break;
                            default:
                                break;
                        }

                        return `${ type } ${ a.parameterName }`;
                    });
                }
            }

            const details: RouteDetails = {
                route: `${ method } ${ controllerPath }${ actionPath }`,
            };

            if (args) {
                details.args = args;
            }

            return details;
        });

        return {
            controller: controllerId,
            endpoints,
        };
    });
}

export function getRawMetadata(container: inversifyInterfaces.Container): Array<RawMetadata> {
    const controllers = getControllersFromContainer(container, true);

    return controllers.map(controller => {
        const {constructor} = controller;

        return {
            controllerMetadata: getControllerMetadata(constructor),
            methodMetadata: getControllerMethodMetadata(constructor),
            parameterMetadata: getControllerParameterMetadata(constructor),
        };
    });
}
