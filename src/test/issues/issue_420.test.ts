import { beforeEach, describe, expect, it } from '@jest/globals';
import * as bodyParser from 'body-parser';
import { Application, Request } from 'express';
import { Container } from 'inversify';
import supertest from 'supertest';
import TestAgent from 'supertest/lib/agent';

import { BaseHttpController } from '../../base_http_controller';
import { controller, httpPut, request } from '../../decorators';
import { InversifyExpressServer } from '../../server';
import { cleanUpMetadata } from '../../utils';

describe('Issue 420', () => {
  beforeEach(() => {
    cleanUpMetadata();
  });

  it('should work with no url params', async () => {
    @controller('/controller')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    class TestController extends BaseHttpController {
      @httpPut('/test')
      public async updateTest(
        @request()
        req: Request<unknown, unknown, { test: string }, void>,
      ) {
        return this.ok({ message: req.body.test });
      }
    }

    const container: Container = new Container();

    const server: InversifyExpressServer = new InversifyExpressServer(
      container,
    );

    server.setConfig((app: Application) => {
      app.use(
        bodyParser.urlencoded({
          extended: true,
        }),
      );
      app.use(bodyParser.json());
    });

    const agent: TestAgent<supertest.Test> = supertest(server.build());

    const response: supertest.Response = await agent
      .put('/controller/test')
      .send({ test: 'test' })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({ message: 'test' });
  });
});
