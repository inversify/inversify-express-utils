import { HttpResponseMessage } from "../httpResponseMessage";
import { OK } from "http-status-codes";
import { interfaces } from "../interfaces";

export default class OkResult implements interfaces.IHttpActionResult {

    public async executeAsync() {
        return new HttpResponseMessage(OK);
    }
}
