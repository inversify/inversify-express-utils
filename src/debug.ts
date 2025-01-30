import { interfaces as inversifyInterfaces } from 'inversify';

import { PARAMETER_TYPE } from './constants';
import type {
  Controller,
  ControllerMethodMetadata,
  ControllerParameterMetadata,
  ParameterMetadata,
  RawMetadata,
  RouteDetails,
  RouteInfo,
} from './interfaces';
import {
  getControllerMetadata,
  getControllerMethodMetadata,
  getControllerParameterMetadata,
  getControllersFromContainer,
} from './utils';

export function getRouteInfo(
  container: inversifyInterfaces.Container,
): RouteInfo[] {
  const raw: RawMetadata[] = getRawMetadata(container);

  return raw.map((r: RawMetadata) => {
    const controllerId: string = (
      r.controllerMetadata.target as { name: string }
    ).name;

    const endpoints: RouteDetails[] = r.methodMetadata.map(
      (m: ControllerMethodMetadata) => {
        const method: string = m.method.toUpperCase();
        const controllerPath: string = r.controllerMetadata.path;
        const actionPath: string = m.path;
        const paramMetadata: ControllerParameterMetadata = r.parameterMetadata;
        let args: (string | undefined)[] | undefined = undefined;

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (paramMetadata !== undefined) {
          const paramMetadataForKey: ParameterMetadata[] | undefined =
            paramMetadata[m.key] || undefined;
          if (paramMetadataForKey) {
            args = (r.parameterMetadata[m.key] || []).map(
              (a: ParameterMetadata) => {
                let type: string = '';
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

                return `${type} ${a.parameterName as string}`;
              },
            );
          }
        }

        const details: RouteDetails = {
          route: `${method} ${controllerPath}${actionPath}`,
        };

        if (args) {
          details.args = args as string[];
        }

        return details;
      },
    );

    return {
      controller: controllerId,
      endpoints,
    };
  });
}

export function getRawMetadata(
  container: inversifyInterfaces.Container,
): RawMetadata[] {
  const controllers: Controller[] = getControllersFromContainer(
    container,
    true,
  );

  return controllers.map((controller: Controller) => {
    const { constructor }: Controller = controller;

    return {
      controllerMetadata: getControllerMetadata(constructor),
      methodMetadata: getControllerMethodMetadata(constructor),
      parameterMetadata: getControllerParameterMetadata(constructor),
    };
  });
}
