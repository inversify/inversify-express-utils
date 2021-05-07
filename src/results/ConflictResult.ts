import { HttpResponseMessage } from "../httpResponseMessage";
import { CONFLICT } from "http-status-codes";
import { interfaces } from "../interfaces";

export default class ConflictResult implements interfaces.IHttpActionResult {
    public async executeAsync() {
        return new HttpResponseMessage(CONFLICT);
    }
}
