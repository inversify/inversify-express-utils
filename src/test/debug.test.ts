import { beforeEach, describe, expect, it } from '@jest/globals';
import { Container } from 'inversify';

import { BaseHttpController } from '../base_http_controller';
import { getRouteInfo } from '../debug';
import {
  controller,
  httpDelete,
  httpGet,
  httpPost,
  requestParam,
} from '../decorators';
import { RouteInfo } from '../interfaces';
import { InversifyExpressServer } from '../server';
import { cleanUpMetadata } from '../utils';

describe('Debug utils', () => {
  beforeEach(() => {
    cleanUpMetadata();
  });

  it('should be able to get router info', () => {
    const container: Container = new Container();

    @controller('/api/user')
    class UserController extends BaseHttpController {
      @httpGet('/')
      public get() {
        return {};
      }

      @httpPost('/')
      public post() {
        return {};
      }

      @httpDelete('/:id')
      public delete(@requestParam('id') _id: string) {
        return {};
      }
    }

    @controller('/api/order')
    class OrderController extends BaseHttpController {
      @httpGet('/')
      public get() {
        return {};
      }

      @httpPost('/')
      public post() {
        return {};
      }

      @httpDelete('/:id')
      public delete(@requestParam('id') _id: string) {
        return {};
      }
    }

    // eslint-disable-next-line @typescript-eslint/typedef
    const TYPES = {
      OrderController: OrderController.name,
      UserController: UserController.name,
    };

    const server: InversifyExpressServer = new InversifyExpressServer(
      container,
    );
    server.build();

    const routeInfo: RouteInfo[] = getRouteInfo(container);

    expect(routeInfo[0]?.controller).toBe(TYPES.OrderController);
    expect(routeInfo[0]?.endpoints[0]?.route).toBe('GET /api/order/');
    expect(routeInfo[0]?.endpoints[0]?.args).toBeUndefined();
    expect(routeInfo[0]?.endpoints[1]?.route).toBe('POST /api/order/');
    expect(routeInfo[0]?.endpoints[1]?.args).toBeUndefined();
    expect(routeInfo[0]?.endpoints[2]?.route).toBe('DELETE /api/order/:id');

    const arg1: string[] | undefined = routeInfo[0]?.endpoints[2]?.args;
    if (arg1 !== undefined) {
      expect(arg1[0]).toBe('@requestParam id');
    } else {
      expect(true).toBe(false);
    }

    expect(routeInfo[1]?.controller).toBe(TYPES.UserController);
    expect(routeInfo[1]?.endpoints[0]?.route).toBe('GET /api/user/');
    expect(routeInfo[1]?.endpoints[1]?.args).toBeUndefined();
    expect(routeInfo[1]?.endpoints[1]?.route).toBe('POST /api/user/');
    expect(routeInfo[1]?.endpoints[1]?.args).toBeUndefined();
    expect(routeInfo[1]?.endpoints[2]?.route).toBe('DELETE /api/user/:id');

    const arg2: string[] | undefined = routeInfo[1]?.endpoints[2]?.args;
    if (arg2 !== undefined) {
      expect(arg2[0]).toBe('@requestParam id');
    } else {
      expect(true).toBe(false);
    }
  });

  it('should be able to handle missig parameter metadata', () => {
    const container: Container = new Container();

    @controller('/api/order')
    class OrderController extends BaseHttpController {
      @httpGet('/')
      public get() {
        return {};
      }

      @httpPost('/')
      public post() {
        return {};
      }
    }

    // eslint-disable-next-line @typescript-eslint/typedef
    const TYPES = {
      OrderController: OrderController.name,
    };

    const server: InversifyExpressServer = new InversifyExpressServer(
      container,
    );
    server.build();

    const routeInfo: RouteInfo[] = getRouteInfo(container);

    expect(routeInfo[0]?.controller).toBe(TYPES.OrderController);
    expect(routeInfo[0]?.endpoints[0]?.route).toBe('GET /api/order/');
    expect(routeInfo[0]?.endpoints[0]?.args).toBeUndefined();
    expect(routeInfo[0]?.endpoints[1]?.route).toBe('POST /api/order/');
    expect(routeInfo[0]?.endpoints[1]?.args).toBeUndefined();
  });

  it('should handle controllers without methods', () => {
    const container: Container = new Container();

    @controller('/api/empty')
    class EmptyController extends BaseHttpController {
      // empty Controller
    }

    // eslint-disable-next-line @typescript-eslint/typedef
    const TYPES = {
      EmptyController: EmptyController.name,
    };

    const server: InversifyExpressServer = new InversifyExpressServer(
      container,
    );
    server.build();

    const routeInfo: RouteInfo[] = getRouteInfo(container);

    expect(routeInfo[0]?.controller).toBe(TYPES.EmptyController);
    expect(routeInfo[0]?.endpoints).toEqual([]);
  });
});
