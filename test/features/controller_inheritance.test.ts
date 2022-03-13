import { Container, injectable } from 'inversify';
import supertest from 'supertest';
import { json, urlencoded } from 'express';
import { InversifyExpressServer } from '../../src/server';
import { controller, httpGet, requestParam, httpDelete, httpPost, httpPut, requestBody, } from '../../src/decorators';
import { cleanUpMetadata } from '../../src/utils';

type ResponseBody = { args: string, status: number };

function getDemoServer() {
  interface Movie {
    name: string;
  }

  const container = new Container();

  @injectable()
  class GenericController<T> {
    @httpGet('/')
    public get() {
      return { status: 'BASE GET!' };
    }

    @httpGet('/:id')
    public getById(
      @requestParam('id') id: string,
    ) {
      return { status: `BASE GET BY ID! ${id}` };
    }

    @httpPost('/')
    public post(
      @requestBody() body: T,
    ) {
      return {
        args: body,
        status: 'BASE POST!'
      };
    }

    @httpPut('/:id')
    public put(
      @requestBody() body: T,
      @requestParam('id') id: string,
    ) {
      return {
        args: body,
        status: `BASE PUT! ${id}`
      };
    }

    @httpDelete('/:id')
    public delete(
      @requestParam('id') id: string,
    ) {
      return { status: `BASE DELETE! ${id}` };
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
        status: `DERIVED DELETE ACTOR! MOVIECONTROLLER1 ${movieId} ${actorId}`
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
        status: `DERIVED DELETE ACTOR! MOVIECONTROLLER2 ${movieId} ${actorId}`
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
        status: `DERIVED DELETE ACTOR! MOVIECONTROLLER3 ${movieId} ${actorId}`
      };
    }
  }

  const app = new InversifyExpressServer(container);

  app.setConfig(a => {
    a.use(json());
    a.use(urlencoded({ extended: true }));
  });

  const server = app.build();

  return server;
}

describe('Derived controller', () => {
  beforeEach(done => {
    cleanUpMetadata();
    done();
  });

  it('Can access methods decorated with @httpGet from parent', done => {
    const server = getDemoServer();

    void supertest(server).get('/api/v1/movies')
      .expect(200)
      .then(res => {
        const r = res.body as ResponseBody;
        expect(r.status).toEqual('BASE GET!');
        done();
      });
  });

  it('Can access methods decorated with @httpGet from parent', done => {
    const server = getDemoServer();
    const id = 5;

    void supertest(server).get(`/api/v1/movies/${id}`)
      .expect(200)
      .then(res => {
        const r = res.body as ResponseBody;
        expect(r.status).toEqual(`BASE GET BY ID! ${id}`);
        done();
      });
  });

  it('Can access methods decorated with @httpPost from parent', done => {
    const server = getDemoServer();
    const movie = { name: 'The Shining' };
    const status = 'BASE POST!';

    void supertest(server).post('/api/v1/movies')
      .send(movie)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200)
      .then(res => {
        const r = res.body as ResponseBody;
        expect(r.status).toEqual(status);
        expect(r.args).toEqual(movie);
        done();
      });
  });

  it('Can access methods decorated with @httpPut from parent', done => {
    const server = getDemoServer();
    const id = 5;
    const movie = { name: 'The Shining' };

    void supertest(server).put(`/api/v1/movies/${id}`)
      .send(movie)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200)
      .then(res => {
        const r = res.body as ResponseBody;
        expect(r.status).toEqual(`BASE PUT! ${id}`);
        expect(r.args).toEqual(movie);
        done();
      });
  });

  it('Can access methods decorated with @httpDelete from parent', done => {
    const server = getDemoServer();
    const id = 5;

    void supertest(server).delete(`/api/v1/movies/${id}`)
      .expect(200)
      .then(res => {
        const r = res.body as ResponseBody;
        expect(r.status).toEqual(`BASE DELETE! ${id}`);
        done();
      });
  });

  it('Derived controller can have its own methods', done => {
    const server = getDemoServer();
    const movieId = 5;
    const actorId = 3;

    void supertest(server).delete(`/api/v1/movies/${movieId}/actors/${actorId}`)
      .expect(200)
      .then(res => {
        const r = res.body as ResponseBody;
        expect(r.status)
          .toEqual(`DERIVED DELETE ACTOR! MOVIECONTROLLER1 ${movieId} ${actorId}`);
        done();
      });
  });

  it('Derived controller 2 can have its own methods', done => {
    const server = getDemoServer();
    const movieId = 5;
    const actorId = 3;

    void supertest(server)
      .delete(`/api/v1/movies2/${movieId}/actors/${actorId}`)
      .expect(200)
      .then(res => {
        const r = res.body as ResponseBody;
        expect(r.status)
          .toEqual(`DERIVED DELETE ACTOR! MOVIECONTROLLER2 ${movieId} ${actorId}`);
        done();
      });
  });

  it('Derived controller 3 can have its own methods', done => {
    const server = getDemoServer();
    const movieId = 5;
    const actorId = 3;

    void supertest(server)
      .delete(`/api/v1/movies3/${movieId}/actors/${actorId}`)
      .expect(200)
      .then(res => {
        const r = res.body as ResponseBody;
        expect(r.status)
          .toEqual(`DERIVED DELETE ACTOR! MOVIECONTROLLER3 ${movieId} ${actorId}`);
        done();
      });
  });
});
