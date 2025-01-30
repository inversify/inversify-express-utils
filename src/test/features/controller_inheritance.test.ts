/* eslint-disable @typescript-eslint/no-unused-vars */
import { beforeEach, describe, expect, it } from '@jest/globals';
import { Application, json, urlencoded } from 'express';
import { Container, injectable } from 'inversify';
import { Response } from 'superagent';
import supertest from 'supertest';

import {
  controller,
  httpDelete,
  httpGet,
  httpOptions,
  httpPost,
  httpPut,
  requestBody,
  requestParam,
} from '../../decorators';
import { InversifyExpressServer } from '../../server';
import { cleanUpMetadata } from '../../utils';

interface ResponseBody {
  args: string;
  status: number;
}

function getDemoServer() {
  interface Movie {
    name: string;
  }

  const container: Container = new Container();

  @injectable()
  class GenericController<T> {
    @httpGet('/')
    public get() {
      return { status: 'BASE GET!' };
    }

    @httpGet('/:id')
    public getById(@requestParam('id') id: string) {
      return { status: `BASE GET BY ID! ${id}` };
    }

    @httpPost('/')
    public post(@requestBody() body: T) {
      return {
        args: body,
        status: 'BASE POST!',
      };
    }

    @httpPut('/:id')
    public put(@requestBody() body: T, @requestParam('id') id: string) {
      return {
        args: body,
        status: `BASE PUT! ${id}`,
      };
    }

    @httpDelete('/:id')
    public delete(@requestParam('id') id: string) {
      return { status: `BASE DELETE! ${id}` };
    }

    @httpOptions('/:id')
    public options(@requestParam('id') id: string) {
      return { status: `BASE OPTIONS! ${id}` };
    }
  }

  @controller('/api/v1/movies')
  class MoviesController extends GenericController<Movie> {
    @httpDelete('/:movieId/actors/:actorId')
    public deleteActor(
      @requestParam('movieId') movieId: string,
      @requestParam('actorId') actorId: string,
    ) {
      return {
        status: `DERIVED DELETE ACTOR! MOVIECONTROLLER1 ${movieId} ${actorId}`,
      };
    }
  }

  @controller('/api/v1/movies2')
  class MoviesController2 extends GenericController<Movie> {
    @httpDelete('/:movieId2/actors/:actorId2')
    public deleteActor(
      @requestParam('movieId2') movieId: string,
      @requestParam('actorId2') actorId: string,
    ) {
      return {
        status: `DERIVED DELETE ACTOR! MOVIECONTROLLER2 ${movieId} ${actorId}`,
      };
    }
  }

  @controller('/api/v1/movies3')
  class MoviesController3 extends GenericController<Movie> {
    @httpDelete('/:movieId3/actors/:actorId3')
    public deleteActor(
      @requestParam('movieId3') movieId: string,
      @requestParam('actorId3') actorId: string,
    ) {
      return {
        status: `DERIVED DELETE ACTOR! MOVIECONTROLLER3 ${movieId} ${actorId}`,
      };
    }
  }

  const app: InversifyExpressServer = new InversifyExpressServer(container);

  app.setConfig((a: Application) => {
    a.use(json());
    a.use(urlencoded({ extended: true }));
  });

  const server: Application = app.build();

  return server;
}

describe('Derived controller', () => {
  beforeEach(() => {
    cleanUpMetadata();
  });

  it('Can access methods decorated with @httpGet from parent', async () => {
    const server: Application = getDemoServer();

    const response: Response = await supertest(server)
      .get('/api/v1/movies')
      .expect(200);

    const body: ResponseBody = response.body as ResponseBody;

    expect(body.status).toEqual('BASE GET!');
  });

  it('Can access methods decorated with @httpGet from parent', async () => {
    const server: Application = getDemoServer();
    const id: number = 5;

    const response: Response = await supertest(server)
      .get(`/api/v1/movies/${id.toString()}`)
      .expect(200);

    const body: ResponseBody = response.body as ResponseBody;

    expect(body.status).toEqual(`BASE GET BY ID! ${id.toString()}`);
  });

  it('Can access methods decorated with @httpPost from parent', async () => {
    const server: Application = getDemoServer();
    const movie: object = { name: 'The Shining' };
    const status: string = 'BASE POST!';

    const response: Response = await supertest(server)
      .post('/api/v1/movies')
      .send(movie)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200);

    const body: ResponseBody = response.body as ResponseBody;
    expect(body.status).toEqual(status);
    expect(body.args).toEqual(movie);
  });

  it('Can access methods decorated with @httpPut from parent', async () => {
    const server: Application = getDemoServer();
    const id: number = 5;
    const movie: object = { name: 'The Shining' };

    const response: Response = await supertest(server)
      .put(`/api/v1/movies/${id.toString()}`)
      .send(movie)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200);

    const body: ResponseBody = response.body as ResponseBody;
    expect(body.status).toEqual(`BASE PUT! ${id.toString()}`);
    expect(body.args).toEqual(movie);
  });

  it('Can access methods decorated with @httpDelete from parent', async () => {
    const server: Application = getDemoServer();
    const id: number = 5;

    const response: Response = await supertest(server)
      .delete(`/api/v1/movies/${id.toString()}`)
      .expect(200);

    const body: ResponseBody = response.body as ResponseBody;
    expect(body.status).toEqual(`BASE DELETE! ${id.toString()}`);
  });

  it('Can access methods decorated with @httpOptions from parent', async () => {
    const server: Application = getDemoServer();
    const id: number = 5;

    const response: Response = await supertest(server)
      .options(`/api/v1/movies/${id.toString()}`)
      .expect(200);

    const body: ResponseBody = response.body as ResponseBody;
    expect(body.status).toEqual(`BASE OPTIONS! ${id.toString()}`);
  });

  it('Derived controller can have its own methods', async () => {
    const server: Application = getDemoServer();
    const movieId: number = 5;
    const actorId: number = 3;

    const response: Response = await supertest(server)
      .delete(
        `/api/v1/movies/${movieId.toString()}/actors/${actorId.toString()}`,
      )
      .expect(200);

    const body: ResponseBody = response.body as ResponseBody;
    expect(body.status).toEqual(
      `DERIVED DELETE ACTOR! MOVIECONTROLLER1 ${movieId.toString()} ${actorId.toString()}`,
    );
  });

  it('Derived controller 2 can have its own methods', async () => {
    const server: Application = getDemoServer();
    const movieId: number = 5;
    const actorId: number = 3;

    const response: Response = await supertest(server)
      .delete(
        `/api/v1/movies2/${movieId.toString()}/actors/${actorId.toString()}`,
      )
      .expect(200);

    const body: ResponseBody = response.body as ResponseBody;
    expect(body.status).toEqual(
      `DERIVED DELETE ACTOR! MOVIECONTROLLER2 ${movieId.toString()} ${actorId.toString()}`,
    );
  });

  it('Derived controller 3 can have its own methods', async () => {
    const server: Application = getDemoServer();
    const movieId: number = 5;
    const actorId: number = 3;

    const response: Response = await supertest(server)
      .delete(
        `/api/v1/movies3/${movieId.toString()}/actors/${actorId.toString()}`,
      )
      .expect(200);

    const body: ResponseBody = response.body as ResponseBody;

    expect(body.status).toEqual(
      `DERIVED DELETE ACTOR! MOVIECONTROLLER3 ${movieId.toString()} ${actorId.toString()}`,
    );
  });
});
