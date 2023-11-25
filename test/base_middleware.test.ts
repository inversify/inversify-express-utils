import { NextFunction, Request, Response } from 'express';
import { parallel } from 'async';
import { Container, injectable, inject, optional, } from 'inversify';
import supertest from 'supertest';
import { InversifyExpressServer, controller, httpGet, BaseMiddleware, BaseHttpController, Principal, AuthProvider, } from '../src/index';
import { cleanUpMetadata } from '../src/utils';

describe('BaseMiddleware', () => {
  beforeEach(done => {
    cleanUpMetadata();
    done();
  });

  it('Should be able to inject BaseMiddleware implementations', done => {
    const TYPES = {
      LoggerMiddleware: Symbol.for('LoggerMiddleware'),
      SomeDependency: Symbol.for('SomeDependency'),
    };

    let principalInstanceCount = 0;

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
      public getUser(
        req: Request,
        res: Response,
        next: NextFunction,
      ) {
        principalInstanceCount += 1;
        const principal = new PrincipalClass({
          email: 'test@test.com',
        });
        return Promise.resolve(principal);
      }
    }

    interface SomeDependency {
      name: string;
    }

    const logEntries: string[] = [];

    @injectable()
    class LoggerMiddleware extends BaseMiddleware {
      @inject(TYPES.SomeDependency)
      private readonly _someDependency!: SomeDependency;
      public handler(
        req: Request,
        res: Response,
        next: NextFunction,
      ) {
        const { email } = this.httpContext.user.details as { email: string };
        logEntries.push(`${email} => ${req.url} ${this._someDependency.name}`);
        next();
      }
    }

    @controller(
      '/',
      (req, res, next) => {
        logEntries.push('Hello from controller middleware!');
        next();
      },
    )
    class TestController extends BaseHttpController {
      @httpGet(
        '/',
        TYPES.LoggerMiddleware,
      )
      public async getTest() {
        if (this.httpContext.user !== null) {
          const { email } = this.httpContext.user.details as { email: string };
          const isAuthenticated = await this.httpContext.user.isAuthenticated();
          logEntries.push(
            `${email} => isAuthenticated() => ${String(isAuthenticated)}`
          );
          return `${email}`;
        }
        return null;
      }
    }

    const container = new Container();

    container.bind<SomeDependency>(TYPES.SomeDependency)
      .toConstantValue({ name: 'SomeDependency!' });

    container.bind<LoggerMiddleware>(TYPES.LoggerMiddleware)
      .to(LoggerMiddleware);

    const server = new InversifyExpressServer(
      container,
      null,
      null,
      null,
      CustomAuthProvider,
    );

    void supertest(server.build())
      .get('/')
      .expect(200, 'test@test.com', () => {
        expect(principalInstanceCount).toBe(1);
        expect(logEntries.length).toBe(3);
        expect(logEntries[0]).toBe('Hello from controller middleware!');
        expect(logEntries[1]).toBe('test@test.com => / SomeDependency!');
        expect(logEntries[2])
          .toBe('test@test.com => isAuthenticated() => true');
        done();
      });
  });

  it('Should allow the middleware to inject services in a HTTP request scope', done => {
    const TRACE_HEADER = 'X-Trace-Id';

    const TYPES = {
      Service: Symbol.for('Service'),
      TraceIdValue: Symbol.for('TraceIdValue'),
      TracingMiddleware: Symbol.for('TracingMiddleware')
    };

    @injectable()
    class TracingMiddleware extends BaseMiddleware {
      public handler(
        req: Request,
        res: Response,
        next: NextFunction,
      ) {
        setTimeout(() => {
          this.bind<string>(TYPES.TraceIdValue)
            .toConstantValue(`${req.header(TRACE_HEADER) as string}`);
          next();
        }, someTimeBetween(0, 500));
      }
    }

    @injectable()
    class Service {
      constructor(
        @inject(TYPES.TraceIdValue)
        private readonly traceID: string) {
      }

      public doSomethingThatRequiresTheTraceID() {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(this.traceID);
          }, someTimeBetween(0, 500));
        });
      }
    }

    @controller('/')
    class TracingTestController extends BaseHttpController {
      constructor(@inject(TYPES.Service) private readonly service: Service) {
        super();
      }

      @httpGet(
        '/',
        TYPES.TracingMiddleware,
      )
      public getTest() {
        return this.service.doSomethingThatRequiresTheTraceID();
      }
    }

    const container = new Container();

    container.bind<TracingMiddleware>(TYPES.TracingMiddleware)
      .to(TracingMiddleware);
    container.bind<Service>(TYPES.Service).to(Service);
    container.bind<string>(TYPES.TraceIdValue).toConstantValue('undefined');

    const api = new InversifyExpressServer(container).build();

    const expectedRequests = 100;
    let handledRequests = 0;

    run(expectedRequests, (executionId: number) => supertest(api)
      .get('/')
      .set(TRACE_HEADER, `trace-id-${executionId}`)
      .expect(200, `trace-id-${executionId}`)
      .then(res => {
        handledRequests += 1;
      }), (err: Error | null | undefined) => {
        expect(handledRequests).toBe(expectedRequests);
        done(err);
      });
  });

  it('Should not allow services injected into a HTTP request scope to be accessible outside the request scope', done => {
    const TYPES = {
      Transaction: Symbol.for('Transaction'),
      TransactionMiddleware: Symbol.for('TransactionMiddleware'),
    };

    class TransactionMiddleware extends BaseMiddleware {
      private count = 0;

      public handler(
        req: Request,
        res: Response,
        next: NextFunction,
      ) {
        this.bind<string>(TYPES.Transaction)
          .toConstantValue(`I am transaction #${this.count += 1}\n`);
        next();
      }
    }

    @controller('/')
    class TransactionTestController extends BaseHttpController {
      constructor(
        @inject(TYPES.Transaction)
        @optional() private transaction: string
      ) {
        super();
      }

      @httpGet('/1', TYPES.TransactionMiddleware)
      public getTest1() {
        return this.transaction;
      }

      @httpGet('/2' /*<= No middleware!*/)
      public getTest2() {
        return this.transaction;
      }
    }

    const container = new Container();

    container.bind<TransactionMiddleware>(
      TYPES.TransactionMiddleware,
    ).to(TransactionMiddleware);
    const app = new InversifyExpressServer(container).build();

    void supertest(app)
      .get('/1')
      .expect(200, 'I am transaction #1', () => {
        void supertest(app)
          .get('/1')
          .expect(200, 'I am transaction #2', () => {
            void supertest(app)
              .get('/2')
              .expect(200, '', () => done() as unknown);
          });
      });
  });
});

function run(
  parallelRuns: number,
  test: (executionId: number) => PromiseLike<unknown>,
  done: (error?: Error | null | undefined) => void,
) {
  const testTaskNo = (id: number) =>
    (cb: (err?: Error | null | undefined) => void) => {
      test(id).then(cb as (value: unknown) => void | PromiseLike<void>, cb);
    };

  const testTasks = Array.from(
    { length: parallelRuns },
    (val: undefined, key: number) => testTaskNo(key),
  );

  parallel(testTasks, done);
}

function someTimeBetween(minimum: number, maximum: number) {
  const min = Math.ceil(minimum);
  const max = Math.floor(maximum);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
