import express, { Application, NextFunction, Request, Response, Router } from 'express';
import { Container } from 'inversify';
import { InversifyExpressServer } from '../src/server';
import { controller } from '../src/decorators';
import { cleanUpMetadata } from '../src/utils';
import { RoutingConfig } from '../src/interfaces';
import { HttpResponseMessage } from '../src/httpResponseMessage';

interface ServerWithTypes {
  _app: Application;
  _router: Router;
  _routingConfig: RoutingConfig;
  handleHttpResponseMessage: (
    message: HttpResponseMessage,
    res: Response
  ) => void;
}


describe('Unit Test: InversifyExpressServer', () => {
  beforeEach(done => {
    cleanUpMetadata();
    done();
  });

  it('should call the configFn before the errorConfigFn', done => {
    const middleware = (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      //
    };

    const configFn = jest.fn((app: Application) => {
      app.use(middleware);
    });

    const errorConfigFn = jest.fn((app: Application) => {
      app.use(middleware);
    });

    const container = new Container();

    @controller('/')
    class TestController { }

    const server = new InversifyExpressServer(container);

    server.setConfig(configFn)
      .setErrorConfig(errorConfigFn);

    expect(configFn).not.toBeCalled();
    expect(errorConfigFn).not.toBeCalled();

    server.build();

    expect(configFn).toHaveBeenCalledTimes(1);
    expect(errorConfigFn).toHaveBeenCalledTimes(1);
    done();
  });

  it('Should allow to pass a custom Router instance as config', () => {
    const container = new Container();

    const customRouter = Router({
      caseSensitive: false,
      mergeParams: false,
      strict: false,
    });

    const serverWithDefaultRouter = new InversifyExpressServer(container);
    const serverWithCustomRouter = new InversifyExpressServer(
      container,
      customRouter
    );

    expect((serverWithDefaultRouter as unknown as ServerWithTypes)
      ._router === customRouter).toBe(false);
    expect((serverWithCustomRouter as unknown as ServerWithTypes)
      ._router === customRouter).toBe(true);
  });

  it('Should allow to provide custom routing configuration', () => {
    const container = new Container();

    const routingConfig = {
      rootPath: '/such/root/path',
    };

    const serverWithDefaultConfig = new InversifyExpressServer(container);
    const serverWithCustomConfig = new InversifyExpressServer(
      container,
      null,
      routingConfig
    );

    expect((serverWithCustomConfig as unknown as ServerWithTypes)
      ._routingConfig).toBe(routingConfig);

    expect((serverWithDefaultConfig as unknown as ServerWithTypes)
      ._routingConfig).not.toEqual(
        (serverWithCustomConfig as unknown as ServerWithTypes)._routingConfig,
      );
  });

  it('Should allow to provide a custom express application', () => {
    const container = new Container();
    const app = express();
    const serverWithDefaultApp = new InversifyExpressServer(container);
    const serverWithCustomApp = new InversifyExpressServer(
      container,
      null,
      null,
      app
    );

    expect((serverWithCustomApp as unknown as ServerWithTypes)._app).toBe(app);
    expect((serverWithDefaultApp as unknown as ServerWithTypes)._app).not
      .toEqual((serverWithCustomApp as unknown as ServerWithTypes)._app);
  });

  it('Should handle a HttpResponseMessage that has no content', () => {
    const container = new Container();
    const server = new InversifyExpressServer(container);

    const httpResponseMessageWithoutContent = new HttpResponseMessage(404);
    const mockResponse: Partial<Response> = {
      sendStatus: jest.fn(),
    };

    (server as unknown as ServerWithTypes).handleHttpResponseMessage(
      httpResponseMessageWithoutContent,
      mockResponse as unknown as Response,
    );

    expect(mockResponse.sendStatus).toHaveBeenCalledWith(404);
  });
});
