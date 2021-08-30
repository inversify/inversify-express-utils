import {expect} from 'chai';
import * as sinon from 'sinon';
import * as express from 'express';
import {Container} from 'inversify';
import {Mock, Times} from 'moq.ts';
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

        const configFn = sinon.spy((app: express.Application) => {
            app.use(middleware);
        });

        const errorConfigFn = sinon.spy((app: express.Application) => {
            app.use(middleware);
        });

        const container = new Container();

        @controller('/')
        class TestController { }

        const server = new InversifyExpressServer(container);

        server.setConfig(configFn)
        .setErrorConfig(errorConfigFn);

        expect(configFn.called).to.eq(false);
        expect(errorConfigFn.called).to.eq(false);

        server.build();

        expect(configFn.calledOnce).to.eqls(true);
        expect(errorConfigFn.calledOnce).to.eqls(true);
        expect(configFn.calledBefore(errorConfigFn)).to.eqls(true);
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

        expect((serverWithDefaultRouter as any)._router === customRouter).to.eq(false);
        expect((serverWithCustomRouter as any)._router === customRouter).to.eqls(true);
    });

    it('Should allow to provide custom routing configuration', () => {
        const container = new Container();

        const routingConfig = {
            rootPath: '/such/root/path',
        };

        const serverWithDefaultConfig = new InversifyExpressServer(container);
        const serverWithCustomConfig = new InversifyExpressServer(container, null, routingConfig);

        expect((serverWithCustomConfig as any)._routingConfig).to.eq(routingConfig);
        expect((serverWithDefaultConfig as any)._routingConfig).to.not.eql(
            (serverWithCustomConfig as any)._routingConfig,
        );
    });

    it('Should allow to provide a custom express application', () => {
        const container = new Container();
        const app = express();
        const serverWithDefaultApp = new InversifyExpressServer(container);
        const serverWithCustomApp = new InversifyExpressServer(container, null, null, app);
        expect((serverWithCustomApp as any)._app).to.eq(app);
        expect((serverWithDefaultApp as any)._app).to.not.eql((serverWithCustomApp as any)._app);
    });

    // TODO Fix this somehow ??
    // https://www.npmjs.com/package/moq.ts/v/3.0.0?activeTab=readme#mock-behavior
    // Now Obsolete
    xit('Should handle a HttpResponseMessage that has no content', () => {
        const container = new Container();
        const server = new InversifyExpressServer(container);

        const httpResponseMessageWithoutContent = new HttpResponseMessage(404);
        const mockResponse = new Mock<express.Response>();
        (server as any).handleHttpResponseMessage(
            httpResponseMessageWithoutContent,
            mockResponse.object(),
        );

        mockResponse.verify(instance => instance.sendStatus(404), Times.Once());
    });
});
