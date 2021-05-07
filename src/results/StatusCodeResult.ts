import { HttpResponseMessage } from "../httpResponseMessage";
import { interfaces } from "../interfaces";

export default class StatusCodeResult implements interfaces.IHttpActionResult {
    constructor(private statusCode: number) { }

    public async executeAsync() {
        return new HttpResponseMessage(this.statusCode);
    }
}
