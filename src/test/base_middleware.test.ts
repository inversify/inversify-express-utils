/* eslint-disable @typescript-eslint/no-unused-vars */
import { beforeEach, describe, expect, it } from '@jest/globals';
import { Application, NextFunction, Request, Response } from 'express';
import { Container, inject, injectable, optional } from 'inversify';
import supertest from 'supertest';

import {
  AuthProvider,
  BaseHttpController,
  BaseMiddleware,
  controller,
  httpGet,
  InversifyExpressServer,
  Principal,
} from '../index';
import { cleanUpMetadata } from '../utils';

describe('BaseMiddleware', () => {
  beforeEach(() => {
    cleanUpMetadata();
  });

  it('Should be able to inject BaseMiddleware implementations', async () => {
    // eslint-disable-next-line @typescript-eslint/typedef
    const TYPES = {
      LoggerMiddleware: Symbol.for('LoggerMiddleware'),
      SomeDependency: Symbol.for('SomeDependency'),
    };

    let principalInstanceCount: number = 0;

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
      public async getUser(_req: Request, _res: Response, _next: NextFunction) {
        principalInstanceCount += 1;

        const principal: PrincipalClass = new PrincipalClass({
          email: 'test@test.com',
        });

        return principal;
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
      public handler(req: Request, _res: Response, next: NextFunction) {
        const { email }: { email: string } = this.httpContext.user.details as {
          email: string;
        };
        logEntries.push(`${email} => ${req.url} ${this._someDependency.name}`);
        next();
      }
    }

    @controller('/', (_req: unknown, _res: unknown, next: NextFunction) => {
      logEntries.push('Hello from controller middleware!');
      next();
    })
    class TestController extends BaseHttpController {
      @httpGet('/', TYPES.LoggerMiddleware)
      public async getTest() {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (this.httpContext.user !== null) {
          const { email }: { email: string } = this.httpContext.user
            .details as { email: string };

          const isAuthenticated: boolean =
            await this.httpContext.user.isAuthenticated();
          logEntries.push(
            `${email} => isAuthenticated() => ${String(isAuthenticated)}`,
          );
          return email;
        }
        return null;
      }
    }

    const container: Container = new Container();

    container
      .bind<SomeDependency>(TYPES.SomeDependency)
      .toConstantValue({ name: 'SomeDependency!' });

    container
      .bind<LoggerMiddleware>(TYPES.LoggerMiddleware)
      .to(LoggerMiddleware);

    const server: InversifyExpressServer = new InversifyExpressServer(
      container,
      null,
      null,
      null,
      CustomAuthProvider,
    );

    await supertest(server.build()).get('/').expect(200, 'test@test.com');

    expect(principalInstanceCount).toBe(1);
    expect(logEntries.length).toBe(3);
    expect(logEntries[0]).toBe('Hello from controller middleware!');
    expect(logEntries[1]).toBe('test@test.com => / SomeDependency!');
    expect(logEntries[2]).toBe('test@test.com => isAuthenticated() => true');
  });

  it('Should allow the middleware to inject services in a HTTP request scope', async () => {
    const TRACE_HEADER: string = 'X-Trace-Id';

    // eslint-disable-next-line @typescript-eslint/typedef
    const TYPES = {
      Service: Symbol.for('Service'),
      TraceIdValue: Symbol.for('TraceIdValue'),
      TracingMiddleware: Symbol.for('TracingMiddleware'),
    };

    @injectable()
    class TracingMiddleware extends BaseMiddleware {
      public handler(req: Request, res: Response, next: NextFunction) {
        setTimeout(
          () => {
            this.bind<string>(TYPES.TraceIdValue).toConstantValue(
              req.header(TRACE_HEADER) as string,
            );
            next();
          },
          someTimeBetween(0, 500),
        );
      }
    }

    @injectable()
    class Service {
      constructor(
        @inject(TYPES.TraceIdValue)
        private readonly traceID: string,
      ) {}

      public async doSomethingThatRequiresTraceId() {
        return new Promise((resolve: (value: unknown) => void) => {
          setTimeout(
            () => {
              resolve(this.traceID);
            },
            someTimeBetween(0, 500),
          );
        });
      }
    }

    @controller('/')
    class TracingTestController extends BaseHttpController {
      constructor(@inject(TYPES.Service) private readonly service: Service) {
        super();
      }

      @httpGet('/', TYPES.TracingMiddleware)
      public async getTest() {
        return this.service.doSomethingThatRequiresTraceId();
      }
    }

    const container: Container = new Container();

    container
      .bind<TracingMiddleware>(TYPES.TracingMiddleware)
      .to(TracingMiddleware);
    container.bind<Service>(TYPES.Service).to(Service);
    container.bind<string>(TYPES.TraceIdValue).toConstantValue('undefined');

    const api: Application = new InversifyExpressServer(container).build();

    const expectedRequests: number = 100;

    await run(expectedRequests, async (executionId: number) => {
      await supertest(api)
        .get('/')
        .set(TRACE_HEADER, `trace-id-${executionId.toString()}`)
        .expect(200, `trace-id-${executionId.toString()}`);
    });
  });

  it('Should not allow services injected into a HTTP request scope to be accessible outside the request scope', async () => {
    // eslint-disable-next-line @typescript-eslint/typedef
    const TYPES = {
      Transaction: Symbol.for('Transaction'),
      TransactionMiddleware: Symbol.for('TransactionMiddleware'),
    };

    class TransactionMiddleware extends BaseMiddleware {
      private count: number = 0;

      public handler(req: Request, res: Response, next: NextFunction) {
        this.bind<string>(TYPES.Transaction).toConstantValue(
          `I am transaction #${(this.count += 1).toString()}\n`,
        );
        next();
      }
    }

    @controller('/')
    class TransactionTestController extends BaseHttpController {
      constructor(
        @inject(TYPES.Transaction)
        @optional()
        private readonly transaction: string,
      ) {
        super();
      }

      @httpGet('/1', TYPES.TransactionMiddleware)
      public getTest1() {
        return this.transaction;
      }

      @httpGet('/2' /*<= No middleware!*/)
      public getTest2() {
        return 'No middleware!';
      }
    }

    const container: Container = new Container();

    container
      .bind<TransactionMiddleware>(TYPES.TransactionMiddleware)
      .to(TransactionMiddleware)
      .inSingletonScope();

    const app: Application = new InversifyExpressServer(container).build();

    await supertest(app).get('/1').expect(200, 'I am transaction #1\n');
    await supertest(app).get('/1').expect(200, 'I am transaction #2\n');
    await supertest(app).get('/2').expect(200, 'No middleware!');
  });
});

async function run(
  parallelRuns: number,
  test: (executionId: number) => PromiseLike<unknown>,
) {
  const tasks: PromiseLike<unknown>[] = new Array<PromiseLike<unknown>>(
    parallelRuns,
  );

  for (let i: number = 0; i < parallelRuns; ++i) {
    tasks[i] = test(i);
  }

  await Promise.all(tasks);
}

function someTimeBetween(minimum: number, maximum: number) {
  const min: number = Math.ceil(minimum);
  const max: number = Math.floor(maximum);

  return Math.floor(Math.random() * (max - min + 1)) + min;
}
