import { HttpResponseMessage } from "../httpResponseMessage";
import { INTERNAL_SERVER_ERROR } from "http-status-codes";
import { interfaces } from "../interfaces";

export default class InternalServerErrorResult implements interfaces.IHttpActionResult {
    public async executeAsync() {
        return new HttpResponseMessage(INTERNAL_SERVER_ERROR);
    }
}
