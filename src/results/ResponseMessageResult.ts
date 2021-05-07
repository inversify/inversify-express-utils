import { HttpResponseMessage } from "../httpResponseMessage";
import { interfaces } from "../interfaces";

export default class ResponseMessageResult implements interfaces.IHttpActionResult {
    constructor(private message: HttpResponseMessage) { }

    public async executeAsync() {
        return this.message;
    }
}
