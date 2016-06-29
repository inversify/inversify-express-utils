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
The package is available on npm:

```
$ npm install --save inversify-express-utils
```

The type definitions are available in the inversify-dts npm package. Please refer to the inversify docs to learn more about the installation process.

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
export class FooController implements Controller {
    
    constructor( @inject('FooService') private fooService: FooService ) {}
    
    @Get('/')
    private index(req: express.Request): string {
        return this.fooService.get(req.query.id);
    }
}
```

### Step 2: Configure kernel and server
Configure the inversify kernel in your composition root as usual.

Then, pass the kernel to the InversifyExpressServer constructor. This will allow it to register all controllers and their dependencies from your kernel and attach them to the express app.
Then just call server.build() to prepare your app.

In order for the InversifyExpressServer to find your controllers, you must bind them to the "Controller" service identifier and tag the binding with the controller's name.
The `Controller` interface exported by inversify-express-utils is empty and solely for convenience, so feel free to implement your own if you want.

```ts
import { Kernel } from 'inversify';
import { InversifyExpressServer } from 'inversify-express-utils';

// set up kernel
let kernel = new Kernel();

// note that you *must* bind your controllers to Controller 
kernel.bind<Controller>('Controller').to(FooController).whenTargetNamed('FooController');
kernel.bind<FooService>('FooService').to(FooService);

// create server
let server = new InversifyExpressServer(kernel);

let app = server.build();
app.listen(3000);
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

### `.setErrorConfig(errorConfigFn)`
Optional - like `.setConfig()`, except this function is applied after registering all app middleware and controller routes.

```ts
let server = new InversifyExpressServer(kernel);
server.setErrorConfig((app) => {
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).send('Something broke!');
    });
});
```

### `.build()`
Attaches all registered controllers and middleware to the express application. Returns the application instance.

```ts
// ...
let server = new InversifyExpressServer(kernel);
server
    .setConfig(configFn)
    .setErrorConfig(errorConfigFn)
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

## Examples
Some examples can be found at the [inversify-express-example](https://github.com/inversify/inversify-express-example) repository.

## License

License under the MIT License (MIT)

Copyright © 2016 [Cody Simms](https://github.com/codyjs)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 

IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
