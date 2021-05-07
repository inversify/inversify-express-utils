import { HttpResponseMessage } from "../httpResponseMessage";
import { MOVED_TEMPORARILY } from "http-status-codes";
import { interfaces } from "../interfaces";
import { URL } from "url";

export default class RedirectResult implements interfaces.IHttpActionResult {
    constructor(private location: string | URL) { }

    public async executeAsync() {
        const response = new HttpResponseMessage(MOVED_TEMPORARILY);
        response.headers["location"] = this.location.toString();
        return response;
    }
}
