"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
require('reflect-metadata');
var sinon = require('sinon');
var request = require('supertest');
var express = require('express');
var chai_1 = require('chai');
var inversify_1 = require('inversify');
var server_1 = require('../src/server');
var kernel_1 = require('../src/kernel');
var route_container_1 = require('../src/route-container');
var decorators_1 = require('../src/decorators');
describe('Framework Tests:', function () {
    var server;
    beforeEach(function (done) {
        kernel_1.refreshKernel();
        route_container_1.refreshContainer();
        done();
    });
    describe('Routing & Request Handling:', function () {
        it('should add a router to routeContainer', function (done) {
            var TestController = (function () {
                function TestController() {
                }
                TestController.prototype.getTest = function (req, res) { };
                __decorate([
                    decorators_1.Get('/'), 
                    __metadata('design:type', Function), 
                    __metadata('design:paramtypes', [Object, Object]), 
                    __metadata('design:returntype', void 0)
                ], TestController.prototype, "getTest", null);
                TestController = __decorate([
                    inversify_1.injectable(),
                    decorators_1.Controller('/'), 
                    __metadata('design:paramtypes', [])
                ], TestController);
                return TestController;
            }());
            var routes = route_container_1.getContainer().getRoutes();
            chai_1.expect(routes.length).to.equal(1);
            chai_1.expect(routes[0].router).to.not.be.undefined;
            chai_1.expect(routes[0].path).to.equal('/');
            done();
        });
        it('should work for each shortcut decorator', function (done) {
            var TestController = (function () {
                function TestController() {
                }
                TestController.prototype.getTest = function (req, res) { res.send('GET'); };
                TestController.prototype.postTest = function (req, res) { res.send('POST'); };
                TestController.prototype.putTest = function (req, res) { res.send('PUT'); };
                TestController.prototype.patchTest = function (req, res) { res.send('PATCH'); };
                TestController.prototype.headTest = function (req, res) { res.send('HEAD'); };
                TestController.prototype.deleteTest = function (req, res) { res.send('DELETE'); };
                __decorate([
                    decorators_1.Get('/'), 
                    __metadata('design:type', Function), 
                    __metadata('design:paramtypes', [Object, Object]), 
                    __metadata('design:returntype', void 0)
                ], TestController.prototype, "getTest", null);
                __decorate([
                    decorators_1.Post('/'), 
                    __metadata('design:type', Function), 
                    __metadata('design:paramtypes', [Object, Object]), 
                    __metadata('design:returntype', void 0)
                ], TestController.prototype, "postTest", null);
                __decorate([
                    decorators_1.Put('/'), 
                    __metadata('design:type', Function), 
                    __metadata('design:paramtypes', [Object, Object]), 
                    __metadata('design:returntype', void 0)
                ], TestController.prototype, "putTest", null);
                __decorate([
                    decorators_1.Patch('/'), 
                    __metadata('design:type', Function), 
                    __metadata('design:paramtypes', [Object, Object]), 
                    __metadata('design:returntype', void 0)
                ], TestController.prototype, "patchTest", null);
                __decorate([
                    decorators_1.Head('/'), 
                    __metadata('design:type', Function), 
                    __metadata('design:paramtypes', [Object, Object]), 
                    __metadata('design:returntype', void 0)
                ], TestController.prototype, "headTest", null);
                __decorate([
                    decorators_1.Delete('/'), 
                    __metadata('design:type', Function), 
                    __metadata('design:paramtypes', [Object, Object]), 
                    __metadata('design:returntype', void 0)
                ], TestController.prototype, "deleteTest", null);
                TestController = __decorate([
                    inversify_1.injectable(),
                    decorators_1.Controller('/'), 
                    __metadata('design:paramtypes', [])
                ], TestController);
                return TestController;
            }());
            kernel_1.getKernel().bind('TestController').to(TestController);
            server = new server_1.InversifyExpressServer(kernel_1.getKernel());
            var agent = request(server.build());
            var get = function () { agent.get('/').expect(200, 'GET', post); };
            var post = function () { agent.post('/').expect(200, 'POST', put); };
            var put = function () { agent.put('/').expect(200, 'PUT', patch); };
            var patch = function () { agent.patch('/').expect(200, 'PATCH', head); };
            var head = function () { agent.head('/').expect(200, 'HEAD', deleteFn); };
            var deleteFn = function () { agent.delete('/').expect(200, 'DELETE', done); };
            get();
        });
        it('should work for more obscure HTTP methods using the Method decorator', function (done) {
            var TestController = (function () {
                function TestController() {
                }
                TestController.prototype.getTest = function (req, res) { res.send('PROPFIND'); };
                __decorate([
                    decorators_1.Method('propfind', '/'), 
                    __metadata('design:type', Function), 
                    __metadata('design:paramtypes', [Object, Object]), 
                    __metadata('design:returntype', void 0)
                ], TestController.prototype, "getTest", null);
                TestController = __decorate([
                    inversify_1.injectable(),
                    decorators_1.Controller('/'), 
                    __metadata('design:paramtypes', [])
                ], TestController);
                return TestController;
            }());
            kernel_1.getKernel().bind('TestController').to(TestController);
            server = new server_1.InversifyExpressServer(kernel_1.getKernel());
            request(server.build())
                .propfind('/')
                .expect(200, 'PROPFIND', done);
        });
        it('should use returned values as response', function (done) {
            var result = { 'hello': 'world' };
            var TestController = (function () {
                function TestController() {
                }
                TestController.prototype.getTest = function (req, res) { return result; };
                __decorate([
                    decorators_1.Get('/'), 
                    __metadata('design:type', Function), 
                    __metadata('design:paramtypes', [Object, Object]), 
                    __metadata('design:returntype', void 0)
                ], TestController.prototype, "getTest", null);
                TestController = __decorate([
                    inversify_1.injectable(),
                    decorators_1.Controller('/'), 
                    __metadata('design:paramtypes', [])
                ], TestController);
                return TestController;
            }());
            kernel_1.getKernel().bind('TestController').to(TestController);
            server = new server_1.InversifyExpressServer(kernel_1.getKernel());
            request(server.build())
                .get('/')
                .expect(200, JSON.stringify(result), done);
        });
    });
    describe('Middleware:', function () {
        var result;
        var middleware = {
            a: function (req, res, next) {
                result += 'a';
                next();
            },
            b: function (req, res, next) {
                result += 'b';
                next();
            },
            c: function (req, res, next) {
                result += 'c';
                next();
            }
        };
        var spyA = sinon.spy(middleware, 'a');
        var spyB = sinon.spy(middleware, 'b');
        var spyC = sinon.spy(middleware, 'c');
        beforeEach(function (done) {
            result = '';
            spyA.reset();
            spyB.reset();
            spyC.reset();
            done();
        });
        it('should call method-level middleware correctly', function (done) {
            var TestController = (function () {
                function TestController() {
                }
                TestController.prototype.getTest = function (req, res) { res.send('GET'); };
                __decorate([
                    decorators_1.Get('/', spyA, spyB, spyC), 
                    __metadata('design:type', Function), 
                    __metadata('design:paramtypes', [Object, Object]), 
                    __metadata('design:returntype', void 0)
                ], TestController.prototype, "getTest", null);
                TestController = __decorate([
                    inversify_1.injectable(),
                    decorators_1.Controller('/'), 
                    __metadata('design:paramtypes', [])
                ], TestController);
                return TestController;
            }());
            kernel_1.getKernel().bind('TestController').to(TestController);
            server = new server_1.InversifyExpressServer(kernel_1.getKernel());
            request(server.build())
                .get('/')
                .expect(200, 'GET', function () {
                chai_1.expect(spyA.calledOnce).to.be.true;
                chai_1.expect(spyB.calledOnce).to.be.true;
                chai_1.expect(spyC.calledOnce).to.be.true;
                chai_1.expect(result).to.equal('abc');
                done();
            });
        });
        it('should call controller-level middleware correctly', function (done) {
            var TestController = (function () {
                function TestController() {
                }
                TestController.prototype.getTest = function (req, res) { res.send('GET'); };
                __decorate([
                    decorators_1.Get('/'), 
                    __metadata('design:type', Function), 
                    __metadata('design:paramtypes', [Object, Object]), 
                    __metadata('design:returntype', void 0)
                ], TestController.prototype, "getTest", null);
                TestController = __decorate([
                    inversify_1.injectable(),
                    decorators_1.Controller('/', spyA, spyB, spyC), 
                    __metadata('design:paramtypes', [])
                ], TestController);
                return TestController;
            }());
            kernel_1.getKernel().bind('TestController').to(TestController);
            server = new server_1.InversifyExpressServer(kernel_1.getKernel());
            request(server.build())
                .get('/')
                .expect(200, 'GET', function () {
                chai_1.expect(spyA.calledOnce).to.be.true;
                chai_1.expect(spyB.calledOnce).to.be.true;
                chai_1.expect(spyC.calledOnce).to.be.true;
                chai_1.expect(result).to.equal('abc');
                done();
            });
        });
        it('should call server-level middleware correctly', function (done) {
            var TestController = (function () {
                function TestController() {
                }
                TestController.prototype.getTest = function (req, res) { res.send('GET'); };
                __decorate([
                    decorators_1.Get('/'), 
                    __metadata('design:type', Function), 
                    __metadata('design:paramtypes', [Object, Object]), 
                    __metadata('design:returntype', void 0)
                ], TestController.prototype, "getTest", null);
                TestController = __decorate([
                    inversify_1.injectable(),
                    decorators_1.Controller('/'), 
                    __metadata('design:paramtypes', [])
                ], TestController);
                return TestController;
            }());
            kernel_1.getKernel().bind('TestController').to(TestController);
            server = new server_1.InversifyExpressServer(kernel_1.getKernel());
            server.setConfig(function (app) {
                app.use(spyA);
                app.use(spyB);
                app.use(spyC);
            });
            request(server.build())
                .get('/')
                .expect(200, 'GET', function () {
                chai_1.expect(spyA.calledOnce).to.be.true;
                chai_1.expect(spyB.calledOnce).to.be.true;
                chai_1.expect(spyC.calledOnce).to.be.true;
                chai_1.expect(result).to.equal('abc');
                done();
            });
        });
        it('should call all middleware in correct order', function (done) {
            var TestController = (function () {
                function TestController() {
                }
                TestController.prototype.getTest = function (req, res) { res.send('GET'); };
                __decorate([
                    decorators_1.Get('/', spyC), 
                    __metadata('design:type', Function), 
                    __metadata('design:paramtypes', [Object, Object]), 
                    __metadata('design:returntype', void 0)
                ], TestController.prototype, "getTest", null);
                TestController = __decorate([
                    inversify_1.injectable(),
                    decorators_1.Controller('/', spyB), 
                    __metadata('design:paramtypes', [])
                ], TestController);
                return TestController;
            }());
            kernel_1.getKernel().bind('TestController').to(TestController);
            server = new server_1.InversifyExpressServer(kernel_1.getKernel());
            server.setConfig(function (app) {
                app.use(spyA);
            });
            request(server.build())
                .get('/')
                .expect(200, 'GET', function () {
                chai_1.expect(spyA.calledOnce).to.be.true;
                chai_1.expect(spyB.calledOnce).to.be.true;
                chai_1.expect(spyC.calledOnce).to.be.true;
                chai_1.expect(result).to.equal('abc');
                done();
            });
        });
    });
});
