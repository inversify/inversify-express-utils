import * as express from 'express';
import supertest from 'supertest';
import {Container} from 'inversify';
import {METADATA_KEY} from '../../src/constants';
import {
    BaseMiddleware,
    ControllerMethodMetadata,
    InversifyExpressServer,
    ControllerMetadata,
} from '../../src/index';
import {
    controller, httpGet, httpMethod, httpPut, withMiddleware,
} from '../../src/decorators';
import {cleanUpMetadata} from '../../src/utils';
import assert from 'assert';

function cleanUpMidDecTestControllerMetadata() {
    class MidDecTestController { }
    Reflect.defineMetadata(
        METADATA_KEY.middleware,
        {},
        MidDecTestController.constructor
    );
}

describe('Unit Test: @middleware decorator', () => {
    beforeEach(done => {
        cleanUpMetadata();
        cleanUpMidDecTestControllerMetadata();
        done();
    });

    it('should add method metadata to a class when a handler is decorated with @withMiddleware', done => {
        const functionMiddleware = () => { 
            // do nothing
        };
        const identifierMiddleware = Symbol.for('foo');
        const path = 'foo';
        const method = 'get';

        class MidDecTestController {
            @httpMethod(method, path)
            @withMiddleware(functionMiddleware)
            public test() { 
                // do nothing
            }

            @httpMethod(method, path)
            @withMiddleware(functionMiddleware, identifierMiddleware)
            public test2() { 
                // do nothing
            }
        }

        const methodMetadata = 
            Reflect.getMetadata(
                METADATA_KEY.controllerMethod,
                MidDecTestController,
            ) as Array<ControllerMethodMetadata>;

        const [testMetaData, test2MetaData] = methodMetadata;
        assert.strictEqual(testMetaData?.middleware.length, 1);
        assert.strictEqual(test2MetaData?.middleware.length, 2);
        assert.deepStrictEqual(testMetaData?.middleware, [functionMiddleware]);
        assert.deepStrictEqual(
            test2MetaData?.middleware,
            [functionMiddleware, identifierMiddleware]
        );
        done();
    });

    it('should add class metadata to a controller class when decorated with @withMiddleware', done => {
        const identifierMiddleware = Symbol.for('foo');
        const functionMiddleware = () => {
            // do nothing
        };

        @controller('/foo')
        @withMiddleware(identifierMiddleware, functionMiddleware)
        class MidDecTestController { }

        const controllerMetaData: ControllerMetadata =
            Reflect.getMetadata(
                METADATA_KEY.controller,
                MidDecTestController,
            ) as ControllerMetadata;

        assert.strictEqual(controllerMetaData.middleware.length, 2);
        assert.deepStrictEqual(
            controllerMetaData.middleware,
            [identifierMiddleware, functionMiddleware]
        );
        done();
    });

    it('should be able to add middleware from multiple decorations', done => {
        const identifierMiddleware = Symbol.for('foo');
        const functionMiddleware = () => {
            // do nothing
        };

        const first = withMiddleware(identifierMiddleware);
        const second = withMiddleware(functionMiddleware);

        @controller('/foo')
        @first
        @second
        class MidDecTestController { }

        const controllerMetaData: ControllerMetadata = 
            Reflect.getMetadata(
                METADATA_KEY.controller,
                MidDecTestController,
            ) as ControllerMetadata;

        assert.strictEqual(controllerMetaData.middleware.length, 2);
        assert.deepStrictEqual(
            controllerMetaData.middleware,
            [functionMiddleware, identifierMiddleware]
        );
        done();
    });

    it('should process all requests when decorating a controller', done => {
        const addTestHeader = withMiddleware((
            req: express.Request,
            res: express.Response,
            next: express.NextFunction
        ) => {
                res.set('test-header', 'foo');
                next();
            },
        );

        @controller('/foo')
        @addTestHeader
        class MidDecTestController {
            @httpGet('/bar')
            public get() {
                return {data: 'hello'};
            }

            @httpPut('/baz')
            public put() {
                return {data: 'there'};
            }
        }

        const container = new Container();
        container.bind<MidDecTestController>('MidDecTestController')
            .to(MidDecTestController);
        const server = new InversifyExpressServer(container);

        const app = server.build();
        void supertest(app)
        .get('/foo/bar')
        .then((res: { header: Record<string, string> }) => {
            assert.strictEqual(res.header['test-header'], 'foo');
        });

        void supertest(app)
        .put('/foo/baz')
        .then((res: { header: Record<string, string> }) => {
            assert.strictEqual(res.header['test-header'], 'foo');
            done();
        });
    });
    it('should process only specific requests when decorating a handler', done => {
        const addTestHeader = withMiddleware((
            req: express.Request,
            res: express.Response,
            next: express.NextFunction
        ) => {
                res.set('test-header', 'foo');
                next();
            },
        );

        @controller('/foo')
        class MidDecTestController {
            @httpGet('/bar')
            public get() {
                return {data: 'hello'};
            }

            @httpPut('/baz')
            @addTestHeader
            public put() {
                return {data: 'there'};
            }
        }

        const container = new Container();
        container.bind<MidDecTestController>('MidDecTestController')
            .to(MidDecTestController);
        const server = new InversifyExpressServer(container);

        const app = server.build();
        void supertest(app)
        .get('/foo/bar')
        .then((res: { header: Record<string, string> }) => {
            assert.strictEqual(res.header['test-header'], undefined);
        });

        void supertest(app)
        .put('/foo/baz')
        .then((res: { header: Record<string, string> }) => {
            assert.strictEqual(res.header['test-header'], 'foo');
            done();
        });
    });
    it('should process requests with both controller- and handler middleware', done => {
        const addHandlerHeader = withMiddleware((
            req: express.Request,
            res: express.Response,
            next: express.NextFunction
        ) => {
                res.set('test-handler', 'hello there!');
                next();
            },
        );
        const addControllerHeader = withMiddleware((
                req: express.Request,
                res: express.Response,
                next: express.NextFunction
            ) => {
                res.set('test-controller', 'general kenobi');
                next();
            },
        );

        @controller('/foo')
        @addControllerHeader
        class MidDecTestController {
            @httpGet('/bar')
            public get() {
                return {data: 'hello'};
            }

            @httpPut('/baz')
            @addHandlerHeader
            public put() {
                return {data: 'there'};
            }
        }

        const container = new Container();
        container.bind<MidDecTestController>('MidDecTestController')
            .to(MidDecTestController);
        const server = new InversifyExpressServer(container);

        const app = server.build();
        void supertest(app)
        .get('/foo/bar')
        .end((req, res: { header: Record<string, string> }) => {
            assert.strictEqual(res.header['test-controller'], 'general kenobi');
            assert.strictEqual(res.header['test-handler'], undefined);
        });

        void supertest(app)
        .put('/foo/baz')
        .end((req, res: { header: Record<string, string> }) => {
            assert.strictEqual(res.header['test-controller'], 'general kenobi');
            assert.strictEqual(res.header['test-handler'], 'hello there!');
            done();
        });
    });
    it('should be able to inject BaseMiddleware services by identifier', done => {
        const container = new Container();
        class MidDecTestMiddleware extends BaseMiddleware {
            public handler(
                req: express.Request,
                res: express.Response,
                next: express.NextFunction,
            ) {
                res.set('test-base-middleware', 'working');
                next();
            }
        }
        container.bind<MidDecTestMiddleware>('TestMiddleware')
            .to(MidDecTestMiddleware);

        @controller('/foo')
        @withMiddleware('TestMiddleware')
        class MidDecTestController {
            @httpGet('/bar')
            public get() {
                return {data: 'hello'};
            }
        }
        container.bind<MidDecTestController>('MidDecTestController')
            .to(MidDecTestController);

        const server = new InversifyExpressServer(container);
        const app = server.build();
        void supertest(app)
        .get('/foo/bar')
        .end((req, res: { header: Record<string, string> }) => {
            assert.strictEqual(res.header['test-base-middleware'], 'working');
            done();
        });
    });
});
