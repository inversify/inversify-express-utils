import * as express from 'express';
import {Container} from 'inversify';
import {InversifyExpressServer} from '../src/server';
import {controller} from '../src/decorators';
import {cleanUpMetadata} from '../src/utils';
import {HttpResponseMessage} from '../src';

describe('Unit Test: InversifyExpressServer', () => {
    beforeEach(done => {
        cleanUpMetadata();
        done();
    });

    it('should call the configFn before the errorConfigFn', done => {
        const middleware = (
            req: express.Request,
            res: express.Response,
            next: express.NextFunction,
        ) => {};

        const configFn = jest.fn((app: express.Application) => {
            app.use(middleware);
        });

        const errorConfigFn = jest.fn((app: express.Application) => {
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

        const customRouter = express.Router({
            caseSensitive: false,
            mergeParams: false,
            strict: false,
        });

        const serverWithDefaultRouter = new InversifyExpressServer(container);
        const serverWithCustomRouter = new InversifyExpressServer(container, customRouter);

        expect((serverWithDefaultRouter as any)._router === customRouter).toBe(false);
        expect((serverWithCustomRouter as any)._router === customRouter).toBe(true);
    });

    it('Should allow to provide custom routing configuration', () => {
        const container = new Container();

        const routingConfig = {
            rootPath: '/such/root/path',
        };

        const serverWithDefaultConfig = new InversifyExpressServer(container);
        const serverWithCustomConfig = new InversifyExpressServer(container, null, routingConfig);

        expect((serverWithCustomConfig as any)._routingConfig).toBe(routingConfig);
        expect((serverWithDefaultConfig as any)._routingConfig).not.toEqual(
            (serverWithCustomConfig as any)._routingConfig,
        );
    });

    it('Should allow to provide a custom express application', () => {
        const container = new Container();
        const app = express();
        const serverWithDefaultApp = new InversifyExpressServer(container);
        const serverWithCustomApp = new InversifyExpressServer(container, null, null, app);
        expect((serverWithCustomApp as any)._app).toBe(app);
        expect((serverWithDefaultApp as any)._app).not.toEqual((serverWithCustomApp as any)._app);
    });

    // TODO Fix this somehow ??
    // https://www.npmjs.com/package/moq.ts/v/3.0.0?activeTab=readme#mock-behavior
    // Now Obsolete
    it('Should handle a HttpResponseMessage that has no content', () => {
        const container = new Container();
        const server = new InversifyExpressServer(container);

        const httpResponseMessageWithoutContent = new HttpResponseMessage(404);
        const mockResponse: Partial<express.Response> = {
            sendStatus: jest.fn(),
        };

        (server as any).handleHttpResponseMessage(
            httpResponseMessageWithoutContent,
            mockResponse,
        );

        expect(mockResponse.sendStatus).toHaveBeenCalledWith(404);
    });
});
