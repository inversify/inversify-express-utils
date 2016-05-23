"use strict";
var kernel_1 = require('./kernel');
var route_container_1 = require('./route-container');
function Controller(path) {
    var middleware = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        middleware[_i - 1] = arguments[_i];
    }
    return function (target) {
        route_container_1.getContainer().registerController(path, middleware, target);
    };
}
exports.Controller = Controller;
function All(path) {
    var middleware = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        middleware[_i - 1] = arguments[_i];
    }
    return Method.apply(void 0, ['all', path].concat(middleware));
}
exports.All = All;
function Get(path) {
    var middleware = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        middleware[_i - 1] = arguments[_i];
    }
    return Method.apply(void 0, ['get', path].concat(middleware));
}
exports.Get = Get;
function Post(path) {
    var middleware = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        middleware[_i - 1] = arguments[_i];
    }
    return Method.apply(void 0, ['post', path].concat(middleware));
}
exports.Post = Post;
function Put(path) {
    var middleware = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        middleware[_i - 1] = arguments[_i];
    }
    return Method.apply(void 0, ['put', path].concat(middleware));
}
exports.Put = Put;
function Patch(path) {
    var middleware = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        middleware[_i - 1] = arguments[_i];
    }
    return Method.apply(void 0, ['patch', path].concat(middleware));
}
exports.Patch = Patch;
function Head(path) {
    var middleware = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        middleware[_i - 1] = arguments[_i];
    }
    return Method.apply(void 0, ['head', path].concat(middleware));
}
exports.Head = Head;
function Delete(path) {
    var middleware = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        middleware[_i - 1] = arguments[_i];
    }
    return Method.apply(void 0, ['delete', path].concat(middleware));
}
exports.Delete = Delete;
function Method(method, path) {
    var middleware = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        middleware[_i - 2] = arguments[_i];
    }
    return function (target, key, value) {
        var handler = function (req, res, next) {
            var result = kernel_1.getKernel().get(target.constructor.name)[key](req, res, next);
            if (result || !res.headersSent)
                res.send(result);
        };
        route_container_1.getContainer().registerHandler(method, path, target, middleware, handler);
    };
}
exports.Method = Method;
