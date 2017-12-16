import { expect } from "chai";
import { Container } from "inversify";
import { InversifyExpressServer } from "../src/index";
import { NO_CONTROLLERS_FOUND } from "../src/constants";

describe("Issue 590", () => {

    it("should throw if no bindings for controllers are declared", () => {
        let container = new Container();
        let server = new InversifyExpressServer(container);
        const throws = () => server.build();
        expect(throws).to.throw(NO_CONTROLLERS_FOUND);
    });

});
