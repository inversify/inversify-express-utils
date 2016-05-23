"use strict";
var inversify_1 = require('inversify');
var kernel = new inversify_1.Kernel();
function getKernel() {
    return kernel;
}
exports.getKernel = getKernel;
function setKernel(k) {
    kernel = k;
}
exports.setKernel = setKernel;
function refreshKernel() {
    kernel = new inversify_1.Kernel();
}
exports.refreshKernel = refreshKernel;
