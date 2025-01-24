/* eslint-disable @typescript-eslint/no-unused-vars */
import { beforeEach, describe, expect, it } from '@jest/globals';
import { Container, inject } from 'inversify';
import supertest from 'supertest';

import { BaseHttpController } from '../base_http_controller';
import { StringContent } from '../content/stringContent';
import { controller, httpGet } from '../decorators';
import { HttpResponseMessage } from '../httpResponseMessage';
import { IHttpActionResult } from '../interfaces';
import { InversifyExpressServer } from '../server';
import { cleanUpMetadata } from '../utils';

describe('BaseHttpController', () => {
  beforeEach(() => {
    cleanUpMetadata();
  });

  it('Should contain httpContext instance', async () => {
    interface SomeDependency {
      name: string;
    }

    @controller('/')
    class TestController extends BaseHttpController {
      private readonly _someDependency: SomeDependency;
      constructor(@inject('SomeDependency') someDependency: SomeDependency) {
        super();
        this._someDependency = someDependency;
      }

      @httpGet('/')
      public async getTest() {
        const headerVal: string | string[] | undefined =
          this.httpContext.request.headers['x-custom'];
        const { name }: SomeDependency = this._someDependency;
        const isAuthenticated: boolean =
          await this.httpContext.user.isAuthenticated();

        expect(isAuthenticated).toBe(false);

        return `${headerVal as string} & ${name}`;
      }
    }

    const container: Container = new Container();

    container
      .bind<SomeDependency>('SomeDependency')
      .toConstantValue({ name: 'SomeDependency!' });

    const server: InversifyExpressServer = new InversifyExpressServer(
      container,
    );

    await supertest(server.build())
      .get('/')
      .set('x-custom', 'test-header!')
      .expect(200, 'test-header! & SomeDependency!');
  });

  it('should support returning an HttpResponseMessage from a method', async () => {
    @controller('/')
    class TestController extends BaseHttpController {
      @httpGet('/')
      public async getTest() {
        const response: HttpResponseMessage = new HttpResponseMessage(200);
        response.headers['x-custom'] = 'test-header';
        response.content = new StringContent('12345');
        return Promise.resolve(response);
      }
    }

    const server: InversifyExpressServer = new InversifyExpressServer(
      new Container(),
    );

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
      public getTest() {
        return new (class TestActionResult implements IHttpActionResult {
          public async executeAsync() {
            const response: HttpResponseMessage = new HttpResponseMessage(400);
            response.content = new StringContent('You done did that wrong');

            return response;
          }
        })();
      }
    }

    const server: InversifyExpressServer = new InversifyExpressServer(
      new Container(),
    );

    await supertest(server.build())
      .get('/')
      .expect(400, 'You done did that wrong');
  });
});
