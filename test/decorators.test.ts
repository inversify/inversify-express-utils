// test libraries
import { expect } from "chai";

// dependencies
import { Controller, Method } from "../src/decorators";
import { IControllerMetadata, IControllerMethodMetadata } from "../src/interfaces";

describe("Unit Test: Controller Decorators", () => {

    it("should add controller metadata to a class when decorated with @Controller", (done) => {
        let middleware = [function() { return; }];
        let path = "foo";

        @Controller(path, ...middleware)
        class TestController {}

        let controllerMetadata: IControllerMetadata = Reflect.getMetadata("_controller", TestController);

        expect(controllerMetadata.middleware).eql(middleware);
        expect(controllerMetadata.path).eql(path);
        expect(controllerMetadata.target).eql(TestController);
        done();
    });


    it("should add method metadata to a class when decorated with @Method", (done) => {
        let middleware = [function() { return; }];
        let path = "foo";
        let method = "get";

        class TestController {
            @Method(method, path, ...middleware)
            public test() { return; }

            @Method("foo", "bar")
            public test2() { return; }

            @Method("bar", "foo")
            public test3() { return; }
        }

        let methodMetadata: IControllerMethodMetadata[] = Reflect.getMetadata("_controller-method", TestController);

        expect(methodMetadata.length).eql(3);

        let metadata: IControllerMethodMetadata = methodMetadata[0];

        expect(metadata.middleware).eql(middleware);
        expect(metadata.path).eql(path);
        expect(metadata.target.constructor).eql(TestController);
        expect(metadata.key).eql("test");
        expect(metadata.method).eql(method);
        done();
    });
});
