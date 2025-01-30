/* eslint-disable @typescript-eslint/no-unused-vars */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import express, {
  Application,
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router,
} from 'express';
import { Container } from 'inversify';

import { controller } from '../decorators';
import { HttpResponseMessage } from '../httpResponseMessage';
import { ConfigFunction, Middleware, RoutingConfig } from '../interfaces';
import { InversifyExpressServer } from '../server';
import { cleanUpMetadata } from '../utils';

interface ServerWithTypes {
  _app: Application;
  _router: Router;
  _routingConfig: RoutingConfig;
  handleHttpResponseMessage: (
    message: HttpResponseMessage,
    res: Response,
  ) => void;
}

describe('Unit Test: InversifyExpressServer', () => {
  beforeEach(() => {
    cleanUpMetadata();
  });

  it('should call the configFn before the errorConfigFn', () => {
    const middleware: Middleware & RequestHandler = (
      _req: Request,
      _res: Response,
      _next: NextFunction,
    ) => undefined;

    const configFn: jest.Mock<ConfigFunction> = jest.fn((app: Application) => {
      app.use(middleware);
    });

    const errorConfigFn: jest.Mock<ConfigFunction> = jest.fn(
      (app: Application) => {
        app.use(middleware);
      },
    );

    const container: Container = new Container();

    @controller('/')
    class TestController {}

    const server: InversifyExpressServer = new InversifyExpressServer(
      container,
    );

    server.setConfig(configFn).setErrorConfig(errorConfigFn);

    expect(configFn).not.toHaveBeenCalled();
    expect(errorConfigFn).not.toHaveBeenCalled();

    server.build();

    expect(configFn).toHaveBeenCalledTimes(1);
    expect(errorConfigFn).toHaveBeenCalledTimes(1);
  });

  it('Should allow to pass a custom Router instance as config', () => {
    const container: Container = new Container();

    const customRouter: Router = Router({
      caseSensitive: false,
      mergeParams: false,
      strict: false,
    });

    const serverWithDefaultRouter: InversifyExpressServer =
      new InversifyExpressServer(container);
    const serverWithCustomRouter: InversifyExpressServer =
      new InversifyExpressServer(container, customRouter);

    expect(
      (serverWithDefaultRouter as unknown as ServerWithTypes)._router ===
        customRouter,
    ).toBe(false);
    expect(
      (serverWithCustomRouter as unknown as ServerWithTypes)._router ===
        customRouter,
    ).toBe(true);
  });

  it('Should allow to provide custom routing configuration', () => {
    const container: Container = new Container();

    // eslint-disable-next-line @typescript-eslint/typedef
    const routingConfig = {
      rootPath: '/such/root/path',
    };

    const serverWithDefaultConfig: InversifyExpressServer =
      new InversifyExpressServer(container);
    const serverWithCustomConfig: InversifyExpressServer =
      new InversifyExpressServer(container, null, routingConfig);

    expect(
      (serverWithCustomConfig as unknown as ServerWithTypes)._routingConfig,
    ).toBe(routingConfig);

    expect(
      (serverWithDefaultConfig as unknown as ServerWithTypes)._routingConfig,
    ).not.toEqual(
      (serverWithCustomConfig as unknown as ServerWithTypes)._routingConfig,
    );
  });

  it('Should allow to provide a custom express application', () => {
    const container: Container = new Container();
    const app: Application = express();
    const serverWithDefaultApp: InversifyExpressServer =
      new InversifyExpressServer(container);
    const serverWithCustomApp: InversifyExpressServer =
      new InversifyExpressServer(container, null, null, app);

    expect((serverWithCustomApp as unknown as ServerWithTypes)._app).toBe(app);
    expect(
      (serverWithDefaultApp as unknown as ServerWithTypes)._app,
    ).not.toEqual((serverWithCustomApp as unknown as ServerWithTypes)._app);
  });

  it('Should handle a HttpResponseMessage that has no content', () => {
    const container: Container = new Container();
    const server: InversifyExpressServer = new InversifyExpressServer(
      container,
    );

    const httpResponseMessageWithoutContent: HttpResponseMessage =
      new HttpResponseMessage(404);

    const mockResponse: Partial<jest.Mocked<Response>> = {
      sendStatus: jest.fn() as unknown,
    } as Partial<jest.Mocked<Response>>;

    (server as unknown as ServerWithTypes).handleHttpResponseMessage(
      httpResponseMessageWithoutContent,
      mockResponse as unknown as Response,
    );

    expect(mockResponse.sendStatus).toHaveBeenCalledWith(404);
  });
});
