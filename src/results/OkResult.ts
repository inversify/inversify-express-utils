import { HttpResponseMessage } from "../httpResponseMessage";
import { OK } from "http-status-codes";
import { interfaces } from "../interfaces";
import { BaseHttpController } from "../base_http_controller";

export default class OkResult implements interfaces.IHttpActionResult {
    constructor(private apiController: BaseHttpController) {}

    public async executeAsync() {
        return new HttpResponseMessage(OK);
    }
}
