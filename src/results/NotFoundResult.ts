import { HttpResponseMessage } from "../httpResponseMessage";
import { NOT_FOUND } from "http-status-codes";
import { interfaces } from "../interfaces";
import { BaseHttpController } from "../base_http_controller";

export default class NotFoundResult implements interfaces.IHttpActionResult {
    constructor(private apiController: BaseHttpController) {}

    public async executeAsync() {
        return new HttpResponseMessage(NOT_FOUND);
    }
}
