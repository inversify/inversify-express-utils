import { Container, inject } from 'inversify';
import supertest from 'supertest';
import { InversifyExpressServer, controller, httpGet, BaseHttpController, IHttpActionResult } from '../src/index';
import { cleanUpMetadata } from '../src/utils';
import { HttpResponseMessage } from '../src/httpResponseMessage';
import { StringContent } from '../src/content/stringContent';

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
        const { name } = this._someDependency;
        const isAuthenticated = await this.httpContext.user.isAuthenticated();
        expect(isAuthenticated).toBe(false);
        return `${headerVal as string} & ${name}`;
      }
    }

    const container = new Container();

    container.bind<SomeDependency>('SomeDependency')
      .toConstantValue({ name: 'SomeDependency!' });

    const server = new InversifyExpressServer(container);

    void supertest(server.build())
      .get('/')
      .set('x-custom', 'test-header!')
      .expect(200, 'test-header! & SomeDependency!', done);
  });

  it('should support returning an HttpResponseMessage from a method',
    async () => {
      @controller('/')
      class TestController extends BaseHttpController {
        @httpGet('/')
        public async getTest() {
          const response = new HttpResponseMessage(200);
          response.headers['x-custom'] = 'test-header';
          response.content = new StringContent('12345');
          return Promise.resolve(response);
        }
      }

      const server = new InversifyExpressServer(new Container());

      await supertest(server.build())
        .get('/')
        .expect(200, '12345')
        .expect('x-custom', 'test-header')
        .expect('content-type', 'text/plain; charset=utf-8');
    });

  it('should support returning an IHttpActionResult from a method',
    async () => {
      @controller('/')
      class TestController extends BaseHttpController {
        @httpGet('/')
        public getTest() {
          return new class TestActionResult implements IHttpActionResult {
            public async executeAsync() {
              const response = new HttpResponseMessage(400);
              response.content = new StringContent('You done did that wrong');
              return Promise.resolve(response);
            }
          }();
        }
      }

      const server = new InversifyExpressServer(new Container());

      void await supertest(server.build())
        .get('/')
        .expect(400, 'You done did that wrong');
    });
});
