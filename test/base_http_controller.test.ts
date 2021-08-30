import {expect} from 'chai';
import {Container, inject} from 'inversify';
import * as supertest from 'supertest';
import {
    InversifyExpressServer,
    controller,
    httpGet,
    BaseHttpController,
} from '../src/index';
import * as interfaces from '../src/interfaces';
import {cleanUpMetadata} from '../src/utils';
import {HttpResponseMessage} from '../src/httpResponseMessage';
import {StringContent} from '../src/content/stringContent';

describe('BaseHttpController', () => {
    beforeEach(done => {
        cleanUpMetadata();
        done();
    });

    it('Should contain httpContext instance', done => {
        interface SomeDependency {
            name: string;
        }

        @controller('/')
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        class TestController extends BaseHttpController {
            private readonly _someDependency: SomeDependency;
            constructor(
            @inject('SomeDependency') someDependency: SomeDependency,
            ) {
                super();
                this._someDependency = someDependency;
            }

            @httpGet('/')
            public async getTest() {
                const headerVal = this.httpContext.request.headers['x-custom'];
                const {name} = this._someDependency;
                const isAuthenticated = await this.httpContext.user.isAuthenticated();
                expect(isAuthenticated).eq(false);
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

    it('should support returning an HttpResponseMessage from a method', async () => {
        @controller('/')
        class TestController extends BaseHttpController {
            @httpGet('/')
            public async getTest() {
                const response = new HttpResponseMessage(200);
                response.headers['x-custom'] = 'test-header';
                response.content = new StringContent('12345');
                return response;
            }
        }

        const server = new InversifyExpressServer(new Container());

        await supertest(server.build())
        .get('/')
        .expect(200, '12345')
        .expect('x-custom', 'test-header')
        .expect('content-type', 'text/plain; charset=utf-8');
    });

    it('should support returning an IHttpActionResult from a method', async () => {
        @controller('/')
        class TestController extends BaseHttpController {
            @httpGet('/')
            public async getTest() {
                return new class TestActionResult implements interfaces.IHttpActionResult {
                    public async executeAsync() {
                        const response = new HttpResponseMessage(400);
                        response.content = new StringContent('You done did that wrong');
                        return response;
                    }
                }();
            }
        }

        const server = new InversifyExpressServer(new Container());

        await supertest(server.build())
        .get('/')
        .expect(400, 'You done did that wrong');
    });
});
