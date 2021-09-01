import {Request, Response} from 'express';
import {Container} from 'inversify';
import * as supertest from 'supertest';
import * as cookieParser from 'cookie-parser';
import {InversifyExpressServer} from '../src/server';
import {
    controller, httpGet, request,
    response, requestParam, queryParam, requestHeaders, cookies,
} from '../src/decorators';
import {cleanUpMetadata} from '../src/utils';

describe('Unit Test: Previous bugs', () => {
    beforeEach(done => {
        cleanUpMetadata();
        done();
    });

    it('should support multiple controller methods with param annotations', done => {
        const container = new Container();

        @controller('/api/test')
        class TestController {
            @httpGet('/')
            public get(@request() req: Request, @response() res: Response): void {
                expect(req.url).not.toEqual(undefined);
                expect((req as any).setHeader).toEqual(undefined);
                // eslint-disable-next-line @typescript-eslint/unbound-method
                expect(res.setHeader).not.toEqual(undefined);
                expect((res as any).url).toEqual(undefined);
                res.json([{id: 1}, {id: 2}]);
            }

            @httpGet('/:id')
            public getById(
                @requestParam('id') id: string,
                    @request() req: Request,
                    @response() res: Response,
            ): void {
                expect(id).toEqual('5');
                expect(req.url).not.toEqual(undefined);
                expect((req as any).setHeader).toEqual(undefined);
                // eslint-disable-next-line @typescript-eslint/unbound-method
                expect(res.setHeader).not.toEqual(undefined);
                expect((res as any).url).toEqual(undefined);
                res.json({id});
            }
        }

        const server = new InversifyExpressServer(container);
        const app = server.build();

        supertest(app).get('/api/test/')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(response1 => {
            expect(Array.isArray(response1.body)).toEqual(true);
            expect(response1.body[0].id).toEqual(1);
            expect(response1.body[1].id).toEqual(2);
        })
        .catch(done);

        supertest(app).get('/api/test/5')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(response2 => {
            expect(Array.isArray(response2.body)).toEqual(false);
            expect(response2.body.id).toEqual('5');
            done();
        })
        .catch(done);
    });

    it('should support empty query params', done => {
        const container = new Container();

        @controller('/api/test')
        class TestController {
            @httpGet('/')
            public get(
            @request() req: Request,
                @response() res: Response,
                @queryParam('empty') empty: string,
                @queryParam('test') test: string,
            ) {
                return {empty, test};
            }
        }

        const server = new InversifyExpressServer(container);
        const app = server.build();

        supertest(app).get('/api/test?test=testquery')
        .expect('Content-Type', /json/)
        .expect(200)
        .then(response1 => {
            expect(response1.body.test).toEqual('testquery');
            expect(response1.body.empty).toBeUndefined();
            done();
        })
        .catch(done);
    });

    it('should support empty headers params', done => {
        const container = new Container();

        @controller('/api/test')
        class TestController {
            @httpGet('/')
            public get(
            @request() req: Request,
                @response() res: Response,
                @requestHeaders('TestHead') test: string,
                @requestHeaders('empty') empty: string,
            ) {
                return {empty, test};
            }
        }

        const server = new InversifyExpressServer(container);
        const app = server.build();

        supertest(app).get('/api/test?test=testquery')
        .expect('Content-Type', /json/)
        .set('TestHead', 'foo')
        .expect(200)
        .then(response1 => {
            expect(response1.body.test).toEqual('foo');
            expect(response1.body.empty).toBeUndefined();
            done();
        })
        .catch(done);
    });

    describe('param objects without a name (key)', () => {
        it('should be injected for params', done => {
            const container = new Container();

            @controller('/api/test')
            class TestController {
                @httpGet('/:id/:other')
                public get(
                @request() req: Request,
                    @response() res: Response,
                    @requestParam() params: any,
                ) {
                    return {...params};
                }
            }

            const server = new InversifyExpressServer(container);
            const app = server.build();

            supertest(app).get('/api/test/23/andMe')
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => {
                expect(res.body.id).toEqual('23');
                expect(res.body.other).toBe('andMe');
                done();
            })
            .catch(done);
        });

        it('should be injected for query params', done => {
            const container = new Container();

            @controller('/api/test')
            class TestController {
                @httpGet('/')
                public get(
                @request() req: Request,
                    @response() res: Response,
                    @queryParam() query: any,
                ) {
                    return {...query};
                }
            }

            const server = new InversifyExpressServer(container);
            const app = server.build();

            supertest(app).get('/api/test?id=23&other=andMe')
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => {
                expect(res.body.id).toEqual('23');
                expect(res.body.other).toBe('andMe');
                done();
            })
            .catch(done);
        });

        it('should be injected for cookie params', done => {
            const container = new Container();

            @controller('/api/test')
            class TestController {
                @httpGet('/')
                public get(
                @request() req: Request,
                    @response() res: Response,
                    @cookies() cookie: any,
                ) {
                    return {...cookie};
                }
            }

            const server = new InversifyExpressServer(container);
            server.setConfig(_app => {
                _app.use(cookieParser());
            });

            const app = server.build();

            supertest(app).get('/api/test')
            .set('Cookie', 'id=23;other=andMe')
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => {
                expect(res.body.id).toEqual('23');
                expect(res.body.other).toBe('andMe');
                done();
            })
            .catch(done);
        });

        it('should be injected for header params', done => {
            const container = new Container();

            @controller('/api/test')
            class TestController {
                @httpGet('/')
                public get(
                @request() req: Request,
                    @response() res: Response,
                    @requestHeaders() headers: any,
                ) {
                    return {...headers};
                }
            }

            const server = new InversifyExpressServer(container);

            const app = server.build();

            supertest(app).get('/api/test')
            .set('id', '23')
            .set('other', 'andMe')
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => {
                expect(res.body.id).toEqual('23');
                expect(res.body.other).toBe('andMe');
                done();
            })
            .catch(done);
        });
    });
});
