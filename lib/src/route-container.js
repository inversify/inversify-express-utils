"use strict";
var express = require('express');
var controllerContainer;
function refreshContainer() {
    controllerContainer = new RouteContainer();
}
exports.refreshContainer = refreshContainer;
function getContainer() {
    if (!controllerContainer)
        refreshContainer();
    return controllerContainer;
}
exports.getContainer = getContainer;
var RouteContainer = (function () {
    function RouteContainer() {
        this.container = {};
    }
    RouteContainer.prototype.registerHandler = function (httpMethod, path, target, middleware, callback) {
        if (!this.container[target.constructor]) {
            this.container[target.constructor] = {
                path: undefined,
                router: express.Router(),
                middleware: undefined
            };
        }
        var router = this.container[target.constructor].router;
        var registerHandlerOnRouter = router[httpMethod];
        registerHandlerOnRouter.apply(router, [path].concat(middleware, [callback]));
    };
    RouteContainer.prototype.registerController = function (path, middleware, target) {
        if (this.container[target]) {
            this.container[target].path = path;
            this.container[target].middleware = middleware;
        }
    };
    RouteContainer.prototype.getRoutes = function () {
        var routes = [];
        for (var i in this.container) {
            if (this.container.hasOwnProperty(i)) {
                routes.push(this.container[i]);
            }
        }
        return routes;
    };
    return RouteContainer;
}());
exports.RouteContainer = RouteContainer;
