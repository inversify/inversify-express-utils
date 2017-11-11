import { httpContext } from "../src/decorators";
import { interfaces } from "../src/interfaces";
import { injectable } from "inversify";

@injectable()
export class BaseHttpController {
    @httpContext protected httpContext: interfaces.HttpContext;
}
