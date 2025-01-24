import { describe, expect, it } from '@jest/globals';

import { HTTP_VERBS_ENUM, METADATA_KEY, PARAMETER_TYPE } from '../constants';
import { controller, httpMethod, params } from '../decorators';
import {
  ControllerMetadata,
  ControllerMethodMetadata,
  ControllerParameterMetadata,
  Middleware,
  ParameterMetadata,
} from '../interfaces';

describe('Unit Test: Controller Decorators', () => {
  it('should add controller metadata to a class when decorated with @controller', () => {
    const middleware: Middleware[] = [
      () => undefined,
      'foo',
      Symbol.for('bar'),
    ];
    const path: string = 'foo';

    @controller(path, ...middleware)
    class TestController {}

    const controllerMetadata: ControllerMetadata = Reflect.getMetadata(
      METADATA_KEY.controller,
      TestController,
    ) as ControllerMetadata;

    expect(controllerMetadata.middleware).toEqual(middleware);
    expect(controllerMetadata.path).toEqual(path);
    expect(controllerMetadata.target).toEqual(TestController);
  });

  it('should add method metadata to a class when decorated with @httpMethod', () => {
    const middleware: Middleware[] = [
      () => undefined,
      'bar',
      Symbol.for('baz'),
    ];
    const path: string = 'foo';
    const method: HTTP_VERBS_ENUM = HTTP_VERBS_ENUM.get;

    class TestController {
      @httpMethod(method, path, ...middleware)
      public test() {
        return undefined;
      }

      @httpMethod('foo' as unknown as HTTP_VERBS_ENUM, 'bar')
      public test2() {
        return undefined;
      }

      @httpMethod('bar' as unknown as HTTP_VERBS_ENUM, 'foo')
      public test3() {
        return undefined;
      }
    }

    const methodMetadata: ControllerMethodMetadata[] = Reflect.getMetadata(
      METADATA_KEY.controllerMethod,
      TestController,
    ) as ControllerMethodMetadata[];

    expect(methodMetadata.length).toEqual(3);

    const metadata: ControllerMethodMetadata | undefined = methodMetadata[0];

    expect(metadata?.middleware).toEqual(middleware);
    expect(metadata?.path).toEqual(path);
    expect(metadata?.target.constructor).toEqual(TestController);
    expect(metadata?.key).toEqual('test');
    expect(metadata?.method).toEqual(method);
  });

  it('should add parameter metadata to a class when decorated with @params', () => {
    const middleware: Middleware[] = [
      () => {
        //
      },
      'bar',
      Symbol.for('baz'),
    ];
    const path: string = 'foo';
    const method: HTTP_VERBS_ENUM = HTTP_VERBS_ENUM.get;
    const methodName: string = 'test';

    class TestController {
      @httpMethod(method, path, ...middleware)
      public test(
        @params(PARAMETER_TYPE.PARAMS, 'id') _id: unknown,
        @params(PARAMETER_TYPE.PARAMS, 'cat') _cat: Record<string, unknown>,
      ) {
        //
      }

      @httpMethod('foo' as unknown as HTTP_VERBS_ENUM, 'bar')
      public test2(
        @params(PARAMETER_TYPE.PARAMS, 'dog') _dog: Record<string, unknown>,
      ) {
        //
      }

      @httpMethod('bar' as unknown as HTTP_VERBS_ENUM, 'foo')
      public test3() {
        //
      }
    }
    const methodMetadataList: ControllerParameterMetadata = Reflect.getMetadata(
      METADATA_KEY.controllerParameter,
      TestController,
    ) as ControllerParameterMetadata;

    expect(methodMetadataList['test'] && true).toEqual(true);

    const paramaterMetadataList: ParameterMetadata[] | undefined =
      methodMetadataList[methodName];
    expect(paramaterMetadataList?.length).toEqual(2);

    const paramaterMetadata: ParameterMetadata | undefined =
      paramaterMetadataList?.[0];
    expect(paramaterMetadata?.index).toEqual(0);
    expect(paramaterMetadata?.parameterName).toEqual('id');
  });
});
