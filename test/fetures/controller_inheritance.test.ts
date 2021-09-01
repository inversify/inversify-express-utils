import {Container, injectable} from 'inversify';
import * as supertest from 'supertest';
import {json, urlencoded} from 'express';
import {InversifyExpressServer} from '../../src/server';
import {
    controller, httpGet, requestParam,
    httpDelete, httpPost, httpPut, requestBody,
} from '../../src/decorators';
import {cleanUpMetadata} from '../../src/utils';

function getDemoServer() {
    interface Movie {
        name: string;
    }

    const container = new Container();

    @injectable()
    class GenericController<T> {
        @httpGet('/')
        public get() {
            return {status: 'BASE GET!'};
        }

        @httpGet('/:id')
        public getById(
        @requestParam('id') id: string,
        ) {
            return {status: `BASE GET BY ID! ${ id }`};
        }

        @httpPost('/')
        public post(
        @requestBody() body: T,
        ) {
            return {
                status: 'BASE POST!',
                args: body,
            };
        }

        @httpPut('/:id')
        public put(
        @requestBody() body: T,
            @requestParam('id') id: string,
        ) {
            return {
                status: `BASE PUT! ${ id }`,
                args: body,
            };
        }

        @httpDelete('/:id')
        public delete(
        @requestParam('id') id: string,
        ) {
            return {status: `BASE DELETE! ${ id }`};
        }
    }

    @controller('/api/v1/movies')
    class MoviesController extends GenericController<Movie> {
        @httpDelete('/:movieId/actors/:actorId')
        public deleteActor(
        @requestParam('movieId') movieId: string,
            @requestParam('actorId') actorId: string,
        ) {
            return {status: `DERIVED DELETE ACTOR! ${ movieId } ${ actorId }`};
        }
    }

    const app = new InversifyExpressServer(container);

    app.setConfig(a => {
        a.use(json());
        a.use(urlencoded({extended: true}));
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

        supertest(server).get('/api/v1/movies')
        .expect(200)
        .then(res => {
            expect(res.body.status).toEqual('BASE GET!');
            done();
        });
    });

    it('Can access methods decorated with @httpGet from parent', done => {
        const server = getDemoServer();
        const id = 5;

        supertest(server).get(`/api/v1/movies/${ id }`)
        .expect(200)
        .then(res => {
            expect(res.body.status).toEqual(`BASE GET BY ID! ${ id }`);
            done();
        });
    });

    it('Can access methods decorated with @httpPost from parent', done => {
        const server = getDemoServer();
        const movie = {name: 'The Shining'};
        const status = 'BASE POST!';

        supertest(server).post('/api/v1/movies')
        .send(movie)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .then(res => {
            expect(res.body.status).toEqual(status);
            expect(res.body.args).toEqual(movie);
            done();
        });
    });

    it('Can access methods decorated with @httpPut from parent', done => {
        const server = getDemoServer();
        const id = 5;
        const movie = {name: 'The Shining'};

        supertest(server).put(`/api/v1/movies/${ id }`)
        .send(movie)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .then(res => {
            expect(res.body.status).toEqual(`BASE PUT! ${ id }`);
            expect(res.body.args).toEqual(movie);
            done();
        });
    });

    it('Can access methods decorated with @httpDelete from parent', done => {
        const server = getDemoServer();
        const id = 5;

        supertest(server).delete(`/api/v1/movies/${ id }`)
        .expect(200)
        .then(res => {
            expect(res.body.status).toEqual(`BASE DELETE! ${ id }`);
            done();
        });
    });

    it('Derived controller can have its own methods', done => {
        const server = getDemoServer();
        const movieId = 5;
        const actorId = 3;

        supertest(server).delete(`/api/v1/movies/${ movieId }/actors/${ actorId }`)
        .expect(200)
        .then(res => {
            expect(res.body.status).toEqual(`DERIVED DELETE ACTOR! ${ movieId } ${ actorId }`);
            done();
        });
    });
});
