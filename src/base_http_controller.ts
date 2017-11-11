import { injectable } from "inversify";
import { httpContext } from "./decorators";
import { interfaces } from "./interfaces";

@injectable()
export class BaseHttpController {
    @httpContext protected httpContext: interfaces.HttpContext;
}
