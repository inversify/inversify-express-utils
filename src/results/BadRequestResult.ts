import { HttpResponseMessage } from "../httpResponseMessage";
import { BAD_REQUEST } from "http-status-codes";
import { interfaces } from "../interfaces";
import { BaseHttpController } from "../base_http_controller";

export default class BadRequestResult implements interfaces.IHttpActionResult {
    constructor(private apiController: BaseHttpController) {}

    public async executeAsync() {
        return new HttpResponseMessage(BAD_REQUEST);
    }
}
