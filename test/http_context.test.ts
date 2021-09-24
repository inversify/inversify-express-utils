import {Container, inject} from 'inversify';
import * as supertest from 'supertest';
import {
    InversifyExpressServer,
    controller,
    httpGet,
    injectHttpContext,
} from '../src/index';
import * as interfaces from '../src/interfaces';
import {cleanUpMetadata} from '../src/utils';

describe('HttpContex', () => {
    beforeEach(done => {
        cleanUpMetadata();
        done();
    });

    it('Should be able to httpContext manually with the @injectHttpContext decorator', done => {
        interface SomeDependency {
            name: string;
        }

        @controller('/')
        class TestController {
            @injectHttpContext private readonly _httpContext!: interfaces.HttpContext;
            @inject('SomeDependency') private readonly _someDependency!: SomeDependency;

            @httpGet('/')
            public async getTest() {
                const headerVal = this._httpContext.request.headers['x-custom'];
                const {name} = this._someDependency;
                const isAuthenticated = await this._httpContext.user.isAuthenticated();
                expect(isAuthenticated).toBe(false);
                return `${ headerVal } & ${ name }`;
            }
        }

        const container = new Container();

        container.bind<SomeDependency>('SomeDependency')
        .toConstantValue({name: 'SomeDependency!'});

        const server = new InversifyExpressServer(container);

        supertest(server.build())
        .get('/')
        .set('x-custom', 'test-header!')
        .expect(200, 'test-header! & SomeDependency!', done);
    });
});
