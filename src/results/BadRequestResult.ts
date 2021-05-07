import { HttpResponseMessage } from "../httpResponseMessage";
import { BAD_REQUEST } from "http-status-codes";
import { interfaces } from "../interfaces";

export default class BadRequestResult implements interfaces.IHttpActionResult {
    public async executeAsync() {
        return new HttpResponseMessage(BAD_REQUEST);
    }
}
