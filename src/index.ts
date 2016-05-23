/// <reference path="../typings/index.d.ts" />
/// <reference path="../node_modules/inversify-dts/inversify/inversify.d.ts" />
/// <reference path="../node_modules/reflect-metadata/reflect-metadata.d.ts" />

import { InversifyExpressServer } from "./server";
import { Controller, Method, Get, Put, Post, Patch, Head, All, Delete } from "./decorators";

export { InversifyExpressServer, Controller, Method, Get, Put, Post, Patch, Head, All, Delete };