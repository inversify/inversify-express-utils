import { HttpResponseMessage } from "../httpResponseMessage";
import { interfaces } from "../interfaces";
import { BaseHttpController } from "../base_http_controller";

export default class StatusCodeResult implements interfaces.IHttpActionResult {
    constructor(private statusCode: number, private apiController: BaseHttpController) {}

    public async executeAsync() {
        return new HttpResponseMessage(this.statusCode);
    }
}
