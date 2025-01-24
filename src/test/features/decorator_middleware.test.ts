import { beforeEach, describe, it } from '@jest/globals';
import assert from 'assert';
import * as express from 'express';
import { Container } from 'inversify';
import { Response } from 'superagent';
import supertest from 'supertest';

import { BaseMiddleware } from '../../base_middleware';
import { HTTP_VERBS_ENUM, METADATA_KEY } from '../../constants';
import {
  controller,
  httpGet,
  httpMethod,
  httpPut,
  withMiddleware,
} from '../../decorators';
import {
  ControllerMetadata,
  ControllerMethodMetadata,
  DecoratorTarget,
} from '../../interfaces';
import { InversifyExpressServer } from '../../server';
import { cleanUpMetadata } from '../../utils';

function cleanUpMidDecTestControllerMetadata() {
  class MidDecTestController {}
  Reflect.defineMetadata(
    METADATA_KEY.middleware,
    {},
    MidDecTestController.constructor,
  );
}

describe('Unit Test: @middleware decorator', () => {
  beforeEach(() => {
    cleanUpMetadata();
    cleanUpMidDecTestControllerMetadata();
  });

  it('should add method metadata to a class when a handler is decorated with @withMiddleware', () => {
    const functionMiddleware: () => void = () => undefined;
    const identifierMiddleware: symbol = Symbol.for('foo');
    const path: string = 'foo';
    const method: HTTP_VERBS_ENUM = HTTP_VERBS_ENUM.get;

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

    const methodMetadata: ControllerMethodMetadata[] = Reflect.getMetadata(
      METADATA_KEY.controllerMethod,
      MidDecTestController,
    ) as ControllerMethodMetadata[];

    const [testMetaData, test2MetaData]: ControllerMethodMetadata[] =
      methodMetadata;
    assert.strictEqual(testMetaData?.middleware.length, 1);
    assert.strictEqual(test2MetaData?.middleware.length, 2);
    assert.deepStrictEqual(testMetaData.middleware, [functionMiddleware]);
    assert.deepStrictEqual(test2MetaData.middleware, [
      functionMiddleware,
      identifierMiddleware,
    ]);
  });

  it('should add class metadata to a controller class when decorated with @withMiddleware', () => {
    const identifierMiddleware: symbol = Symbol.for('foo');
    const functionMiddleware: () => void = () => undefined;

    @controller('/foo')
    @withMiddleware(identifierMiddleware, functionMiddleware)
    class MidDecTestController {}

    const controllerMetaData: ControllerMetadata = Reflect.getMetadata(
      METADATA_KEY.controller,
      MidDecTestController,
    ) as ControllerMetadata;

    assert.strictEqual(controllerMetaData.middleware.length, 2);
    assert.deepStrictEqual(controllerMetaData.middleware, [
      identifierMiddleware,
      functionMiddleware,
    ]);
  });

  it('should be able to add middleware from multiple decorations', () => {
    const identifierMiddleware: symbol = Symbol.for('foo');
    const functionMiddleware: () => void = () => undefined;

    const first: (
      target: DecoratorTarget | NewableFunction,
      methodName?: string,
    ) => void = withMiddleware(identifierMiddleware);
    const second: (
      target: DecoratorTarget | NewableFunction,
      methodName?: string,
    ) => void = withMiddleware(functionMiddleware);

    @controller('/foo')
    @first
    @second
    class MidDecTestController {}

    const controllerMetaData: ControllerMetadata = Reflect.getMetadata(
      METADATA_KEY.controller,
      MidDecTestController,
    ) as ControllerMetadata;

    assert.strictEqual(controllerMetaData.middleware.length, 2);
    assert.deepStrictEqual(controllerMetaData.middleware, [
      functionMiddleware,
      identifierMiddleware,
    ]);
  });

  it('should process all requests when decorating a controller', async () => {
    const addTestHeader: (
      target: DecoratorTarget | NewableFunction,
      methodName?: string,
    ) => void = withMiddleware(
      (
        _req: express.Request,
        res: express.Response,
        next: express.NextFunction,
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
        return { data: 'hello' };
      }

      @httpPut('/baz')
      public put() {
        return { data: 'there' };
      }
    }

    const container: Container = new Container();
    container
      .bind<MidDecTestController>('MidDecTestController')
      .to(MidDecTestController);
    const server: InversifyExpressServer = new InversifyExpressServer(
      container,
    );

    const app: express.Application = server.build();

    const barResponse: Response = await supertest(app).get('/foo/bar');
    const bazResponse: Response = await supertest(app).put('/foo/baz');

    assert.strictEqual(barResponse.header['test-header'], 'foo');
    assert.strictEqual(bazResponse.header['test-header'], 'foo');
  });

  it('should process only specific requests when decorating a handler', async () => {
    const addTestHeader: (
      target: DecoratorTarget | NewableFunction,
      methodName?: string,
    ) => void = withMiddleware(
      (
        _req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        res.set('test-header', 'foo');
        next();
      },
    );

    @controller('/foo')
    class MidDecTestController {
      @httpGet('/bar')
      public get() {
        return { data: 'hello' };
      }

      @httpPut('/baz')
      @addTestHeader
      public put() {
        return { data: 'there' };
      }
    }

    const container: Container = new Container();
    container
      .bind<MidDecTestController>('MidDecTestController')
      .to(MidDecTestController);
    const server: InversifyExpressServer = new InversifyExpressServer(
      container,
    );

    const app: express.Application = server.build();

    const barResponse: Response = await supertest(app).get('/foo/bar');
    const bazResponse: Response = await supertest(app).put('/foo/baz');

    assert.strictEqual(barResponse.header['test-header'], undefined);
    assert.strictEqual(bazResponse.header['test-header'], 'foo');
  });

  it('should process requests with both controller- and handler middleware', async () => {
    const addHandlerHeader: (
      target: DecoratorTarget | NewableFunction,
      methodName?: string,
    ) => void = withMiddleware(
      (
        _req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        res.set('test-handler', 'hello there!');
        next();
      },
    );

    const addControllerHeader: (
      target: DecoratorTarget | NewableFunction,
      methodName?: string,
    ) => void = withMiddleware(
      (
        _req: express.Request,
        res: express.Response,
        next: express.NextFunction,
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
        return { data: 'hello' };
      }

      @httpPut('/baz')
      @addHandlerHeader
      public put() {
        return { data: 'there' };
      }
    }

    const container: Container = new Container();
    container
      .bind<MidDecTestController>('MidDecTestController')
      .to(MidDecTestController);

    const server: InversifyExpressServer = new InversifyExpressServer(
      container,
    );

    const app: express.Application = server.build();

    const barResponse: Response = await supertest(app).get('/foo/bar');

    assert.strictEqual(barResponse.header['test-controller'], 'general kenobi');
    assert.strictEqual(barResponse.header['test-handler'], undefined);

    const bazResponse: Response = await supertest(app).put('/foo/baz');

    assert.strictEqual(bazResponse.header['test-controller'], 'general kenobi');
    assert.strictEqual(bazResponse.header['test-handler'], 'hello there!');
  });

  it('should be able to inject BaseMiddleware services by identifier', async () => {
    const container: Container = new Container();
    class MidDecTestMiddleware extends BaseMiddleware {
      public handler(
        _req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) {
        res.set('test-base-middleware', 'working');
        next();
      }
    }
    container
      .bind<MidDecTestMiddleware>('TestMiddleware')
      .to(MidDecTestMiddleware);

    @controller('/foo')
    @withMiddleware('TestMiddleware')
    class MidDecTestController {
      @httpGet('/bar')
      public get() {
        return { data: 'hello' };
      }
    }
    container
      .bind<MidDecTestController>('MidDecTestController')
      .to(MidDecTestController);

    const server: InversifyExpressServer = new InversifyExpressServer(
      container,
    );

    const app: express.Application = server.build();

    const response: Response = await supertest(app).get('/foo/bar');

    assert.strictEqual(response.header['test-base-middleware'], 'working');
  });
});
