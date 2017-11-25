import { injectable } from "inversify";
import { injectHttpContext } from "./decorators";
import { interfaces } from "./interfaces";

@injectable()
export class BaseHttpController {
    @injectHttpContext protected httpContext: interfaces.HttpContext;
}
