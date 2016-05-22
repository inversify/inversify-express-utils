"use strict";
var express = require('express');
var kernel_1 = require('./kernel');
var route_container_1 = require('./route-container');
var InversifyExpressServer = (function () {
    function InversifyExpressServer(kernel) {
        this.app = express();
        kernel_1.setKernel(kernel);
    }
    InversifyExpressServer.prototype.setConfig = function (fn) {
        this.configFn = fn;
        return this;
    };
    InversifyExpressServer.prototype.build = function () {
        if (this.configFn) {
            this.configFn.apply(undefined, [this.app]);
        }
        this.useRoutes();
        return this.app;
    };
    InversifyExpressServer.prototype.useRoutes = function () {
        var _this = this;
        route_container_1.getContainer().getRoutes().forEach(function (route) {
            (_a = _this.app).use.apply(_a, [route.path].concat(route.middleware, [route.router]));
            var _a;
        });
    };
    return InversifyExpressServer;
}());
exports.InversifyExpressServer = InversifyExpressServer;
