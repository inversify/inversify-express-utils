import { HttpResponseMessage } from "../httpResponseMessage";
import { interfaces } from "../interfaces";
import { BaseHttpController } from "../base_http_controller";

export default class ResponseMessageResult implements interfaces.IHttpActionResult {
    constructor(private message: HttpResponseMessage, private apiController: BaseHttpController) {}

    public async executeAsync() {
        return this.message;
    }
}
