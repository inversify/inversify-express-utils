import { HttpResponseMessage } from "../httpResponseMessage";
import { CONFLICT } from "http-status-codes";
import { interfaces } from "../interfaces";
import { BaseHttpController } from "../base_http_controller";

export default class ConflictResult implements interfaces.IHttpActionResult {
    constructor(private apiController: BaseHttpController) {}

    public async executeAsync() {
        return new HttpResponseMessage(CONFLICT);
    }
}
