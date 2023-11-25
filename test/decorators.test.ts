import { controller, httpMethod, params } from '../src/decorators';
import { HTTP_VERBS_ENUM, METADATA_KEY, PARAMETER_TYPE } from '../src/constants';
import { ControllerMetadata, ControllerMethodMetadata, ControllerParameterMetadata, ParameterMetadata } from '../src';

describe('Unit Test: Controller Decorators', () => {

  it('should add controller metadata to a class when decorated with @controller', done => {
    const middleware = [() => {
      //
    }, 'foo', Symbol.for('bar')];
    const path = 'foo';

    @controller(path, ...middleware)
    class TestController { }

    const controllerMetadata = Reflect.getMetadata(
      METADATA_KEY.controller,
      TestController,
    ) as ControllerMetadata;

    expect(controllerMetadata.middleware).toEqual(middleware);
    expect(controllerMetadata.path).toEqual(path);
    expect(controllerMetadata.target).toEqual(TestController);
    done();
  });

  it('should add method metadata to a class when decorated with @httpMethod', done => {
    const middleware = [() => {
      //
    }, 'bar', Symbol.for('baz')];
    const path = 'foo';
    const method: keyof typeof HTTP_VERBS_ENUM = 'get';

    class TestController {
      @httpMethod(method, path, ...middleware)
      public test() {
        //
      }

      @httpMethod('foo' as unknown as keyof typeof HTTP_VERBS_ENUM, 'bar')
      public test2() {
        //
      }

      @httpMethod('bar' as unknown as keyof typeof HTTP_VERBS_ENUM, 'foo')
      public test3() {
        //
      }
    }

    const methodMetadata = Reflect.getMetadata(
      METADATA_KEY.controllerMethod,
      TestController,
    ) as Array<ControllerMethodMetadata>;

    expect(methodMetadata.length).toEqual(3);

    const metadata: ControllerMethodMetadata | undefined = methodMetadata[0];

    expect(metadata?.middleware).toEqual(middleware);
    expect(metadata?.path).toEqual(path);
    expect(metadata?.target.constructor).toEqual(TestController);
    expect(metadata?.key).toEqual('test');
    expect(metadata?.method).toEqual(method);
    done();
  });

  it('should add parameter metadata to a class when decorated with @params', done => {
    const middleware = [() => {
      //
    }, 'bar', Symbol.for('baz')];
    const path = 'foo';
    const method: keyof typeof HTTP_VERBS_ENUM = 'get';
    const methodName = 'test';

    class TestController {
      @httpMethod(method, path, ...middleware)
      public test(
        @params(PARAMETER_TYPE.PARAMS, 'id') id: unknown,
        @params(PARAMETER_TYPE.PARAMS, 'cat') cat: Record<string, unknown>
      ) {
        //
      }

      @httpMethod('foo' as unknown as keyof typeof HTTP_VERBS_ENUM, 'bar')
      public test2(
        @params(PARAMETER_TYPE.PARAMS, 'dog') dog: Record<string, unknown>) {
        //
      }

      @httpMethod('bar' as unknown as keyof typeof HTTP_VERBS_ENUM, 'foo')
      public test3() {
        //
      }
    }
    const methodMetadataList = Reflect.getMetadata(
      METADATA_KEY.controllerParameter,
      TestController,
    ) as ControllerParameterMetadata;

    expect(methodMetadataList['test'] && true).toEqual(true);

    const paramaterMetadataList:
      Array<ParameterMetadata> | undefined = methodMetadataList[methodName];
    expect(paramaterMetadataList?.length).toEqual(2);

    const paramaterMetadata: ParameterMetadata | undefined =
      paramaterMetadataList?.[0];
    expect(paramaterMetadata?.index).toEqual(0);
    expect(paramaterMetadata?.parameterName).toEqual('id');
    done();
  });
});
