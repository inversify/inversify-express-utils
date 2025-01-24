/* eslint-disable @typescript-eslint/no-unused-vars */
import { beforeEach, describe, expect, it } from '@jest/globals';
import { Container, inject, injectable } from 'inversify';
import supertest from 'supertest';

import {
  AuthProvider,
  BaseHttpController,
  controller,
  httpGet,
  InversifyExpressServer,
  Principal,
} from '../index';
import { cleanUpMetadata } from '../utils';

describe('AuthProvider', () => {
  beforeEach(() => {
    cleanUpMetadata();
  });

  it('Should be able to access current user via HttpContext', async () => {
    interface SomeDependency {
      name: string;
    }

    class PrincipalClass implements Principal {
      public details: unknown;
      constructor(details: unknown) {
        this.details = details;
      }

      public async isAuthenticated() {
        return Promise.resolve<boolean>(true);
      }

      public async isResourceOwner(resourceId: unknown) {
        return Promise.resolve<boolean>(resourceId === 1111);
      }

      public async isInRole(role: string) {
        return Promise.resolve<boolean>(role === 'admin');
      }
    }

    @injectable()
    class CustomAuthProvider implements AuthProvider {
      @inject('SomeDependency')
      private readonly _someDependency!: SomeDependency;

      public async getUser() {
        const principal: PrincipalClass = new PrincipalClass({
          email: `${this._someDependency.name}@test.com`,
        });
        return Promise.resolve(principal);
      }
    }

    interface SomeDependency {
      name: string;
    }

    @controller('/')
    class TestController extends BaseHttpController {
      @inject('SomeDependency')
      private readonly _someDependency!: SomeDependency;

      @httpGet('/')
      public async getTest() {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (this.httpContext.user !== null) {
          const { email }: { email: string } = this.httpContext.user
            .details as { email: string };
          const { name }: SomeDependency = this._someDependency;
          const isAuthenticated: boolean =
            await this.httpContext.user.isAuthenticated();

          expect(isAuthenticated).toEqual(true);

          return `${email} & ${name}`;
        }
        return null;
      }
    }

    const container: Container = new Container();

    container
      .bind<SomeDependency>('SomeDependency')
      .toConstantValue({ name: 'SomeDependency!' });

    const server: InversifyExpressServer = new InversifyExpressServer(
      container,
      null,
      null,
      null,
      CustomAuthProvider,
    );

    await supertest(server.build())
      .get('/')
      .expect(200, 'SomeDependency!@test.com & SomeDependency!');
  });
});
