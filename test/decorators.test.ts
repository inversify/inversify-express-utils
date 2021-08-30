import {expect} from 'chai';
import {controller, httpMethod, params} from '../src/decorators';
import {HTTP_VERBS_ENUM, METADATA_KEY, PARAMETER_TYPE} from '../src/constants';
import {
    ControllerMetadata,
    ControllerMethodMetadata,
    ControllerParameterMetadata,
    ParameterMetadata,
} from '../src';

describe('Unit Test: Controller Decorators', () => {
    it('should add controller metadata to a class when decorated with @controller', done => {
        const middleware = [() => {}, 'foo', Symbol.for('bar')];
        const path = 'foo';

        @controller(path, ...middleware)
        class TestController { }

        const controllerMetadata: ControllerMetadata = Reflect.getMetadata(
            METADATA_KEY.controller,
            TestController,
        );

        expect(controllerMetadata.middleware).eql(middleware);
        expect(controllerMetadata.path).eql(path);
        expect(controllerMetadata.target).eql(TestController);
        done();
    });

    it('should add method metadata to a class when decorated with @httpMethod', done => {
        const middleware = [() => {}, 'bar', Symbol.for('baz')];
        const path = 'foo';
        const method: keyof typeof HTTP_VERBS_ENUM = 'get';

        class TestController {
            @httpMethod(method, path, ...middleware)
            public test() { }

            @httpMethod('foo' as unknown as keyof typeof HTTP_VERBS_ENUM, 'bar')
            public test2() { }

            @httpMethod('bar' as unknown as keyof typeof HTTP_VERBS_ENUM, 'foo')
            public test3() { }
        }

        const methodMetadata: Array<ControllerMethodMetadata> = Reflect.getMetadata(
            METADATA_KEY.controllerMethod,
            TestController,
        );

        expect(methodMetadata.length).eql(3);

        const metadata: ControllerMethodMetadata | undefined = methodMetadata[0];

        expect(metadata?.middleware).eql(middleware);
        expect(metadata?.path).eql(path);
        expect(metadata?.target.constructor).eql(TestController);
        expect(metadata?.key).eql('test');
        expect(metadata?.method).eql(method);
        done();
    });

    it('should add parameter metadata to a class when decorated with @params', done => {
        const middleware = [() => {}, 'bar', Symbol.for('baz')];
        const path = 'foo';
        const method: keyof typeof HTTP_VERBS_ENUM = 'get';
        const methodName = 'test';

        class TestController {
            @httpMethod(method, path, ...middleware)
            public test(@params(PARAMETER_TYPE.PARAMS, 'id') id: any, @params(PARAMETER_TYPE.PARAMS, 'cat') cat: any) { }

            @httpMethod('foo' as unknown as keyof typeof HTTP_VERBS_ENUM, 'bar')
            public test2(@params(PARAMETER_TYPE.PARAMS, 'dog') dog: any) { }

            @httpMethod('bar' as unknown as keyof typeof HTTP_VERBS_ENUM, 'foo')
            public test3() { }
        }
        const methodMetadataList: ControllerParameterMetadata = Reflect.getMetadata(
            METADATA_KEY.controllerParameter,
            TestController,
        );
        expect(methodMetadataList['test']).to.eqls(true);

        const metadataList: Array<ParameterMetadata> | undefined = methodMetadataList[methodName];
        expect(metadataList?.length).eql(2);

        const paramaterMetadata: ParameterMetadata | undefined = metadataList?.[0];
        expect(paramaterMetadata?.index).eql(0);
        expect(paramaterMetadata?.parameterName).eql('id');
        done();
    });
});
