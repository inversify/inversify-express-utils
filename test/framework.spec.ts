/// <reference path="../typings/index.d.ts" />
/// <reference path="../node_modules/inversify-dts/inversify/inversify.d.ts" />
/// <reference path="../node_modules/reflect-metadata/reflect-metadata.d.ts" />

import 'reflect-metadata';

// test libraries
import * as sinon from 'sinon';
import * as request from 'supertest';
import * as express from 'express';
import { expect } from 'chai';

// dependencies
import { injectable, IKernel } from 'inversify';
import { InversifyExpressServer } from '../src/server';
import { getKernel, refreshKernel } from '../src/kernel';
import { getContainer, refreshContainer } from '../src/route-container';
import { Controller, Method, Get, Post, Put, Patch, Head, Delete } from '../src/decorators';

describe('Framework Tests:', () => {
    var server: InversifyExpressServer;

    beforeEach((done) => {
        refreshKernel();
        refreshContainer();
        done();
    });
    
    describe('Routing & Request Handling:', () => {
        
        it('should add a router to routeContainer', (done) => {
            @injectable()
            @Controller('/')
            class TestController { @Get('/') getTest(req: express.Request, res: express.Response) { } }
            var routes = getContainer().getRoutes();

            expect(routes.length).to.equal(1);
            expect(routes[0].router).to.not.be.undefined;
            expect(routes[0].path).to.equal('/');
            done();
        });


        it('should work for each shortcut decorator', (done) => {
            @injectable()
            @Controller('/')
            class TestController {
                @Get('/') getTest(req: express.Request, res: express.Response) { res.send('GET') }
                @Post('/') postTest(req: express.Request, res: express.Response) { res.send('POST') }
                @Put('/') putTest(req: express.Request, res: express.Response) { res.send('PUT') }
                @Patch('/') patchTest(req: express.Request, res: express.Response) { res.send('PATCH') }
                @Head('/') headTest(req: express.Request, res: express.Response) { res.send('HEAD') }
                @Delete('/') deleteTest(req: express.Request, res: express.Response) { res.send('DELETE') }
            }
            getKernel().bind<TestController>('TestController').to(TestController);

            server = new InversifyExpressServer(getKernel());
            var agent = request(server.build());

            var get = () => { agent.get('/').expect(200, 'GET', post) }
            var post = () => { agent.post('/').expect(200, 'POST', put) }
            var put = () => { agent.put('/').expect(200, 'PUT', patch) }
            var patch = () => { agent.patch('/').expect(200, 'PATCH', head) }
            var head = () => { agent.head('/').expect(200, 'HEAD', deleteFn) }
            var deleteFn = () => { agent.delete('/').expect(200, 'DELETE', done) }

            get();
        });


        it('should work for more obscure HTTP methods using the Method decorator', (done) => {
            @injectable()
            @Controller('/')
            class TestController {
                @Method('propfind', '/') getTest(req: express.Request, res: express.Response) { res.send('PROPFIND') }
            }
            getKernel().bind<TestController>('TestController').to(TestController);

            server = new InversifyExpressServer(getKernel());
            request(server.build())
                .propfind('/')
                .expect(200, 'PROPFIND', done);
        });
        
        
        it('should use returned values as response', (done) => {
            var result = {'hello': 'world'};
            
            @injectable()
            @Controller('/')
            class TestController {
                @Get('/') getTest(req: express.Request, res: express.Response) { return result }
            }
            getKernel().bind<TestController>('TestController').to(TestController);

            server = new InversifyExpressServer(getKernel());
            request(server.build())
                .get('/')
                .expect(200, JSON.stringify(result), done);
        });
    });
    

    describe('Middleware:', () => {
        var result: string;
        var middleware: any = {
            a: function (req: express.Request, res: express.Response, next: express.NextFunction) {
                result += 'a';
                next();
            },
            b: function (req: express.Request, res: express.Response, next: express.NextFunction) {
                result += 'b';
                next();
            },
            c: function (req: express.Request, res: express.Response, next: express.NextFunction) {
                result += 'c';
                next();
            }
        };
        var spyA = sinon.spy(middleware, 'a');
        var spyB = sinon.spy(middleware, 'b');
        var spyC = sinon.spy(middleware, 'c');
        
        beforeEach((done) => {
            result = '';
            spyA.reset();
            spyB.reset();
            spyC.reset();
            done(); 
        });
        
        it('should call method-level middleware correctly', (done) => {
            @injectable()
            @Controller('/')
            class TestController {
                @Get('/', spyA, spyB, spyC) getTest(req: express.Request, res: express.Response) { res.send('GET') }
            }
            getKernel().bind<TestController>('TestController').to(TestController);

            server = new InversifyExpressServer(getKernel());
            request(server.build())
                .get('/')
                .expect(200, 'GET', function () {
                    expect(spyA.calledOnce).to.be.true;
                    expect(spyB.calledOnce).to.be.true;
                    expect(spyC.calledOnce).to.be.true;
                    expect(result).to.equal('abc');
                    done();
                })
        });
        
        
        it('should call controller-level middleware correctly', (done) => {
            @injectable()
            @Controller('/', spyA, spyB, spyC)
            class TestController {
                @Get('/') getTest(req: express.Request, res: express.Response) { res.send('GET') }
            }
            getKernel().bind<TestController>('TestController').to(TestController);

            server = new InversifyExpressServer(getKernel());
            request(server.build())
                .get('/')
                .expect(200, 'GET', function () {
                    expect(spyA.calledOnce).to.be.true;
                    expect(spyB.calledOnce).to.be.true;
                    expect(spyC.calledOnce).to.be.true;
                    expect(result).to.equal('abc');
                    done();
                })
        });
        
        
        it('should call server-level middleware correctly', (done) => {
            @injectable()
            @Controller('/')
            class TestController {
                @Get('/') getTest(req: express.Request, res: express.Response) { res.send('GET') }
            }
            getKernel().bind<TestController>('TestController').to(TestController);

            server = new InversifyExpressServer(getKernel());
            
            server.setConfig((app) => {
               app.use(spyA);
               app.use(spyB);
               app.use(spyC); 
            });
            
            request(server.build())
                .get('/')
                .expect(200, 'GET', function () {
                    expect(spyA.calledOnce).to.be.true;
                    expect(spyB.calledOnce).to.be.true;
                    expect(spyC.calledOnce).to.be.true;
                    expect(result).to.equal('abc');
                    done();
                })
        });
        
        
        it('should call all middleware in correct order', (done) => {
            @injectable()
            @Controller('/', spyB)
            class TestController {
                @Get('/', spyC) getTest(req: express.Request, res: express.Response) { res.send('GET') }
            }
            getKernel().bind<TestController>('TestController').to(TestController);

            server = new InversifyExpressServer(getKernel());
            
            server.setConfig((app) => {
               app.use(spyA); 
            });
            
            request(server.build())
                .get('/')
                .expect(200, 'GET', function () {
                    expect(spyA.calledOnce).to.be.true;
                    expect(spyB.calledOnce).to.be.true;
                    expect(spyC.calledOnce).to.be.true;
                    expect(result).to.equal('abc');
                    done();
                })
        });
    });
});