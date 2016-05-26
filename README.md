# inversify-express-utils

[![Join the chat at https://gitter.im/inversify/InversifyJS](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/inversify/InversifyJS?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://secure.travis-ci.org/inversify/inversify-express-utils.svg?branch=master)](https://travis-ci.org/inversify/inversify-express-utils)
[![codecov.io](https://codecov.io/github/inversify/inversify-express-utils/coverage.svg?branch=master)](https://codecov.io/github/inversify/inversify-express-utils?branch=master)
[![npm version](https://badge.fury.io/js/inversify-express-utils.svg)](http://badge.fury.io/js/inversify-express-utils)
[![Dependencies](https://david-dm.org/inversify/inversify-express-utils.svg)](https://david-dm.org/inversify/inversify-express-utils#info=dependencies)
[![img](https://david-dm.org/inversify/inversify-express-utils/dev-status.svg)](https://david-dm.org/inversify/inversify-express-utils/#info=devDependencies)
[![img](https://david-dm.org/inversify/inversify-express-utils/peer-status.svg)](https://david-dm.org/inversify/inversify-express-utils/#info=peerDependenciess)
[![Known Vulnerabilities](https://snyk.io/test/github/inversify/inversify-express-utils/badge.svg)](https://snyk.io/test/github/inversify/inversify-express-utils)

[![NPM](https://nodei.co/npm/inversify-express-utils.png?downloads=true&downloadRank=true)](https://nodei.co/npm/inversify-express-utils/)
[![NPM](https://nodei.co/npm-dl/inversify-express-utils.png?months=9&height=3)](https://nodei.co/npm/inversify-express-utils/)

Some utilities for the development of express applications with Inversify.

## Installation
Coming soon to npm!

## The Basics

### Step 1: Decorate your controllers
To use a class as a "controller" for your express app, simply add the `@Controller` decorator to the class. Similarly, decorate methods of the class to serve as request handlers. 
The following example will declare a controller that responds to `GET /foo'.

```ts
import * as express from 'express';
import { Controller, Get } from 'inversify-express-utils';
import { injectable, inject } from 'inversify';

@Controller('/foo')
@injectable()
export class FooController {
    
    constructor( @inject('FooService') private fooService: FooService ) {}
    
    @Get('/')
    private index(req: express.Request): string {
        return this.fooService.get(req.query.id);
    }
}

@injectable()
export class FooService {
    
    private data = {
      1: 'Foo',
      2: 'Bar'  
    };
    
    public get(id: number): string {
        return this.data[id];
    }
}
```

### Step 2: Configure kernel and server
Configure the inversify kernel in your composition root as usual.

Then, pass the kernel to the InversifyExpressServer constructor. This will allow it to register all controllers and their dependencies from your kernel and attach them to the express app.
Then just call server.build() to prepare your app.

```ts
import 'reflect-metadata';
import * as express from 'express';
import { Kernel } from 'inversify';
import { InversifyExpressServer } from 'inversify-express-utils';

import { FooController } from './controllers/foo-controller';
import { FooService } from './services/foo-service';

// set up kernel
let kernel = new Kernel();
kernel.bind<FooService>('FooService').to(FooService);
kernel.bind<FooController>('FooController').to(FooController);

// create server
let server = new InversifyExpressServer(kernel);

server
    .build()
    .listen(3000, 'localhost', callback);

function callback() {
    console.log('listening on http://localhost:3000');
}
```

## InversifyExpressServer
A wrapper for an express Application.

### `.setConfig(configFn)`
Optional - exposes the express application object for convenient loading of server-level middleware.

```ts
import * as morgan from 'morgan';
// ...
let server = new InversifyExpressServer(kernel);
server.setConfig((app) => {
    var logger = morgan('combined')
    app.use(logger);
});
```

### `.build()`
Attaches all registered controllers and middleware to the express application. Returns the application instance.

```ts
// ...
let server = new InversifyExpressServer(kernel);
server
    .setConfig(configFn)
    .build()
    .listen(3000, 'localhost', callback);
```

## Decorators

### `@Controller(path, [middleware, ...])`

Registers the decorated class as a controller with a root path, and optionally registers any global middleware for this controller.

### `@Method(method, path, [middleware, ...])`

Registers the decorated controller method as a request handler for a particular path and method, where the method name is a valid express routing method.

### `@SHORTCUT(path, [middleware, ...])`

Shortcut decorators which are simply wrappers for `@Method`. Right now these include `@Get`, `@Post`, `@Put`, `@Patch`, `@Head`, `@Delete`, and `@All`. For anything more obscure, use `@Method` (Or make a PR :smile:).
