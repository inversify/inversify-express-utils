import { HttpResponseMessage } from "../httpResponseMessage";
import { NOT_FOUND } from "http-status-codes";
import { interfaces } from "../interfaces";

export default class NotFoundResult implements interfaces.IHttpActionResult {
    public async executeAsync() {
        return new HttpResponseMessage(NOT_FOUND);
    }
}
