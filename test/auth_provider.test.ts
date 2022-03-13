import { Container, injectable, inject } from 'inversify';
import supertest from 'supertest';
import { InversifyExpressServer, controller, httpGet, BaseHttpController, Principal, AuthProvider, } from '../src/index';
import { cleanUpMetadata } from '../src/utils';

describe('AuthProvider', () => {
  beforeEach(done => {
    cleanUpMetadata();
    done();
  });

  it('Should be able to access current user via HttpContext', done => {
    interface SomeDependency {
      name: string;
    }

    class PrincipalClass implements Principal {
      public details: unknown;
      constructor(details: unknown) {
        this.details = details;
      }

      public isAuthenticated() {
        return Promise.resolve<boolean>(true);
      }

      public isResourceOwner(resourceId: unknown) {
        return Promise.resolve<boolean>(resourceId === 1111);
      }

      public isInRole(role: string) {
        return Promise.resolve<boolean>(role === 'admin');
      }
    }

    @injectable()
    class CustomAuthProvider implements AuthProvider {
      @inject('SomeDependency')
      private readonly _someDependency!: SomeDependency;

      public getUser() {
        const principal = new PrincipalClass({
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
        if (this.httpContext.user !== null) {
          const { email } = this.httpContext.user.details as { email: string };
          const { name } = this._someDependency;
          const isAuthenticated = await this.httpContext.user.isAuthenticated();
          expect(isAuthenticated).toEqual(true);
          return `${email} & ${name}`;
        }
        return null;
      }
    }

    const container = new Container();

    container.bind<SomeDependency>('SomeDependency')
      .toConstantValue({ name: 'SomeDependency!' });

    const server = new InversifyExpressServer(
      container,
      null,
      null,
      null,
      CustomAuthProvider,
    );

    void supertest(server.build())
      .get('/')
      .expect(200, 'SomeDependency!@test.com & SomeDependency!', done);
  });
});
