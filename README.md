# inversify-express-utils

[![Join the chat at https://gitter.im/inversify/InversifyJS](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/inversify/InversifyJS?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://secure.travis-ci.org/inversify/inversify-express-utils.svg?branch=master)](https://travis-ci.org/inversify/inversify-express-utils)
[![Test Coverage](https://codeclimate.com/github/inversify/inversify-express-utils/badges/coverage.svg)](https://codeclimate.com/github/inversify/inversify-express-utils/coverage)
[![npm version](https://badge.fury.io/js/inversify-express-utils.svg)](http://badge.fury.io/js/inversify-express-utils)
[![Dependencies](https://david-dm.org/inversify/inversify-express-utils.svg)](https://david-dm.org/inversify/inversify-express-utils#info=dependencies)
[![img](https://david-dm.org/inversify/inversify-express-utils/dev-status.svg)](https://david-dm.org/inversify/inversify-express-utils/#info=devDependencies)
[![img](https://david-dm.org/inversify/inversify-express-utils/peer-status.svg)](https://david-dm.org/inversify/inversify-express-utils/#info=peerDependenciess)
[![Known Vulnerabilities](https://snyk.io/test/github/inversify/inversify-express-utils/badge.svg)](https://snyk.io/test/github/inversify/inversify-express-utils)

[![NPM](https://nodei.co/npm/inversify-express-utils.png?downloads=true&downloadRank=true)](https://nodei.co/npm/inversify-express-utils/)
[![NPM](https://nodei.co/npm-dl/inversify-express-utils.png?months=9&height=3)](https://nodei.co/npm/inversify-express-utils/)

Some utilities for the development of express applications with Inversify.

## Installation

You can install `inversify-express-utils` using npm:

```
$ npm install inversify inversify-express-utils reflect-metadata --save
```

The `inversify-express-utils` type definitions are included in the npm module and require TypeScript 2.0.
Please refer to the [InversifyJS documentation](https://github.com/inversify/InversifyJS#installation) to learn more about the installation process.

## The Basics

### Step 1: Decorate your controllers

To use a class as a "controller" for your express app, simply add the `@controller` decorator to the class. Similarly, decorate methods of the class to serve as request handlers.
The following example will declare a controller that responds to `GET /foo'.

```ts
import * as express from "express";
import { interfaces, controller, httpGet, httpPost, httpDelete, request, queryParam, response, requestParam } from "inversify-express-utils";
import { injectable, inject } from "inversify";

@controller("/foo")
@injectable()
export class FooController implements interfaces.Controller {

    constructor( @inject("FooService") private fooService: FooService ) {}

    @httpGet("/")
    private index(req: express.Request, res: express.Response, next: express.NextFunction): string {
        return this.fooService.get(req.query.id);
    }

    @httpGet("/")
    private list(@queryParam("start") start: number, @queryParam("count") count: number): string {
        return this.fooService.get(start, count);
    }

    @httpPost("/")
    private async create(@request() req: express.Request, @response() res: express.Response) {
        try {
            await this.fooService.create(req.body);
            res.sendStatus(201);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    @httpDelete("/:id")
    private delete(@requestParam("id") id: string, @response() res: express.Response): Promise<void> {
        return this.fooService.delete(id)
            .then(() => res.sendStatus(204))
            .catch((err: Error) => {
                res.status(400).json({ error: err.message });
            });
    }
}
```

### Step 2: Configure container and server

Configure the inversify container in your composition root as usual.

Then, pass the container to the InversifyExpressServer constructor. This will allow it to register all controllers and their dependencies from your container and attach them to the express app.
Then just call server.build() to prepare your app.

In order for the InversifyExpressServer to find your controllers, you must bind them to the `TYPE.Controller` service identifier and tag the binding with the controller's name.
The `Controller` interface exported by inversify-express-utils is empty and solely for convenience, so feel free to implement your own if you want.

```ts
import * as bodyParser from 'body-parser';

import { Container } from 'inversify';
import { interfaces, InversifyExpressServer, TYPE } from 'inversify-express-utils';

// set up container
let container = new Container();

// note that you *must* bind your controllers to Controller
container.bind<interfaces.Controller>(TYPE.Controller).to(FooController).whenTargetNamed('FooController');
container.bind<FooService>('FooService').to(FooService);

// create server
let server = new InversifyExpressServer(container);
server.setConfig((app) => {
  // add body parser
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(bodyParser.json());
});

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
let server = new InversifyExpressServer(container);

server.setConfig((app) => {
    var logger = morgan('combined')
    app.use(logger);
});
```

### `.setErrorConfig(errorConfigFn)`

Optional - like `.setConfig()`, except this function is applied after registering all app middleware and controller routes.

```ts
let server = new InversifyExpressServer(container);
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
let server = new InversifyExpressServer(container);
server
    .setConfig(configFn)
    .setErrorConfig(errorConfigFn)
    .build()
    .listen(3000, 'localhost', callback);
```

## Using a custom Router

It is possible to pass a custom `Router` instance to `InversifyExpressServer`:

```ts
let container = new Container();

let router = express.Router({
    caseSensitive: false,
    mergeParams: false,
    strict: false
});

let server = new InversifyExpressServer(container, router);
```

By default server will serve the API at `/` path, but sometimes you might need to use different root namespace, for
example all routes should start with `/api/v1`. It is possible to pass this setting via routing configuration to
`InversifyExpressServer`

```ts
let container = new Container();

let server = new InversifyExpressServer(container, null, { rootPath: "/api/v1" });
```

## Using a custom express application

It is possible to pass a custom `express.Application` instance to `InversifyExpressServer`:

```ts
let container = new Container();

let app = express();
//Do stuff with app

let server = new InversifyExpressServer(container, null, null, app);
```

## Decorators

### `@controller(path, [middleware, ...])`

Registers the decorated class as a controller with a root path, and optionally registers any global middleware for this controller.

### `@httpMethod(method, path, [middleware, ...])`

Registers the decorated controller method as a request handler for a particular path and method, where the method name is a valid express routing method.

### `@SHORTCUT(path, [middleware, ...])`

Shortcut decorators which are simply wrappers for `@httpMethod`. Right now these include `@httpGet`, `@httpPost`, `@httpPut`, `@httpPatch`, `@httpHead`, `@httpDelete`, and `@All`. For anything more obscure, use `@httpMethod` (Or make a PR :smile:).

### `@request()`

Binds a method parameter to the request object.

### `@response()`

Binds a method parameter to the response object.

### `@requestParam(name?: string)`

Binds a method parameter to request.params object or to a specific parameter if a name is passed.

### `@queryParam(name?: string)`

Binds a method parameter to request.query or to a specific query parameter if a name is passed.

### `@requestBody(name?: string)`

Binds a method parameter to request.body or to a specific body property if a name is passed. If the bodyParser middleware is not used on the express app, this will bind the method parameter to the express request object.

### `@requestHeaders(name?: string)`

Binds a method parameter to the request headers.

### `@cookies()`

Binds a method parameter to the request cookies.

### `@next()`

Binds a method parameter to the next() function.

## HttpContext

The `HttpContext` property allow us to access the current request,
response and user with ease. `HttpContext` is available as a property
in controllers derived from `BaseHttpController`.

```ts
import { injectable, inject } from "inversify";
import {
    controller, httpGet, BaseHttpController
} from "inversify-express-utils";

@injectable()
@controller("/")
class UserPreferencesController extends BaseHttpController {

    @inject("AuthService") private readonly _authService: AuthService;

    @httpGet("/")
    public async get() {
        const token = this.httpContext.request.headers["x-auth-token"];
        return await this._authService.getUserPreferences(token);
    }
}
```

If you are creating a custom controller you will need to inject `HttpContext` manually
using the `@httpContext` decorator:

```ts
import { injectable, inject } from "inversify";
import {
    controller, httpGet, BaseHttpController, httpContext, interfaces
} from "inversify-express-utils";

const authService = inject("AuthService")

@injectable()
@controller("/")
class UserPreferencesController {

    @httpContext private readonly _httpContext: interfaces.HttpContext;
    @authService private readonly _authService: AuthService;

    @httpGet("/")
    public async get() {
        const token = this.httpContext.request.headers["x-auth-token"];
        return await this._authService.getUserPreferences(token);
    }
}
```

## AuthProvider

The `HttpContext` will not have access to the current user if you don't
create a custom `AuthProvider` implementation:

```ts
const server = new InversifyExpressServer(
    container, null, null, null, CustomAuthProvider
);
```

We need to implement the `AuthProvider` interface.

The `AuthProvider` allow us to get an user (`Principal`):

```ts
import { injectable, inject } from "inversify";
import {} from "inversify-express-utils";

const authService = inject("AuthService");

@injectable()
class CustomAuthProvider implements interfaces.AuthProvider {

    @authService private readonly _authService: AuthService;

    public async getUser(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ): Promise<interfaces.Principal> {
        const token = req.headers["x-auth-token"]
        const user = await this._authService.getUser(token);
        const principal = new Principal(user);
        return principal;
    }

}
```

We alsoneed to implement the Principal interface.
The `Principal` interface allow us to:

- Access the details of an user
- Check if it has access to certain resource
- Check if it is authenticated
- Check if it is in an user role

```ts
class Principal implements interfaces.Principal {
    public details: any;
    public constrcutor(details: any) {
        this.details = details;
    }
    public isAuthenticated(): Promise<boolean> {
        return Promise.resolve(true);
    }
    public isResourceOwner(resourceId: any): Promise<boolean> {
        return Promise.resolve(resourceId === 1111);
    }
    public isInRole(role: string): Promise<boolean> {
        return Promise.resolve(role === "admin");
    }
}
```

We can then access the current user (Principal) via the `HttpContext`:

```ts
@injectable()
@controller("/")
class UserDetailsController extends BaseHttpController {

    @inject("AuthService") private readonly _authService: AuthService;

    @httpGet("/")
    public async getUserDetails() {
        if (this.httpContext.user.isAuthenticated()) {
            return this.httpContext.user.details;
        } else {
            throw new Error();
        }
    }
}
```

## Examples

Some examples can be found at the [inversify-express-example](https://github.com/inversify/inversify-express-example) repository.

## License

License under the MIT License (MIT)

Copyright © 2016 [Cody Simms](https://github.com/codyjs)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.

IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
