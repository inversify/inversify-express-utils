# inversify-express-utils
Some utilities for the development of express applications with Inversify

## Decorators

* `@Controller(path, [middleware, ...])`

Registers the decorated class as a controller with a root path, and optionally registers any global middleware for this controller.

* `@Method(method, path, [middleware, ...])`

Registers the decorated method as a request handler for a particular path and method, where the method is a valid method on the express.Router class.

* `@SHORTCUT(path, [middleware, ...])`

Shortcut decorators which are simply wrappers for `@Method`. Right now these include `@Get`, `@Post`, `@Put`, `@Patch`, `@Head`, `@Delete`, and `@All`. For anything more obscure, use `@Method` (Or make a PR :smile:).

### Example

#### FooController:
```Typescript
import * as express from 'express';
import { Controller, Get } from '../framework/decorators';
import { FooService } from '../services/foo-service';
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
```

#### FooService:
```Typescript
import { injectable } from 'inversify';

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

#### app.ts (composition root)
```Typescript
/// <reference path="../node_modules/inversify/type_definitions/inversify/inversify.d.ts" />
/// <reference path="../node_modules/reflect-metadata/reflect-metadata.d.ts" />

import "reflect-metadata";
import * as express from 'express';
import { Kernel } from 'inversify';
import { Server } from './framework/server';
import { FooController } from './controllers/foo-controller';
import { FooService } from './services/foo-service';

// set up kernel
var kernel = new Kernel();
kernel.bind<FooService>('FooService').to(FooService);
kernel.bind<FooController>('FooController').to(FooController);

// create server
var server = new Server(kernel);

server
    .build()
    .listen(3000, 'localhost', callback);

function callback() {
    console.log('listening on http://localhost:3000');
}
```