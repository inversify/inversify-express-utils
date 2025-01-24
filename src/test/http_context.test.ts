/* eslint-disable @typescript-eslint/no-unused-vars */
import { beforeEach, describe, expect, it } from '@jest/globals';
import { Container, inject } from 'inversify';
import supertest from 'supertest';

import { controller, httpGet, injectHttpContext } from '../decorators';
import { HttpContext } from '../interfaces';
import { InversifyExpressServer } from '../server';
import { cleanUpMetadata } from '../utils';

describe('HttpContex', () => {
  beforeEach(() => {
    cleanUpMetadata();
  });

  it('Should be able to httpContext manually with the @injectHttpContext decorator', async () => {
    interface SomeDependency {
      name: string;
    }

    @controller('/')
    class TestController {
      @injectHttpContext private readonly _httpContext!: HttpContext;
      @inject('SomeDependency')
      private readonly _someDependency!: SomeDependency;

      @httpGet('/')
      public async getTest() {
        const headerVal: string | string[] | undefined =
          this._httpContext.request.headers['x-custom'];
        const { name }: SomeDependency = this._someDependency;
        const isAuthenticated: boolean =
          await this._httpContext.user.isAuthenticated();
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
});
