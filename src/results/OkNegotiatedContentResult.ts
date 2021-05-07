import { HttpResponseMessage } from "../httpResponseMessage";
import { OK } from "http-status-codes";
import { interfaces } from "../interfaces";
import { StringContent } from "../content/stringContent";

export default class OkNegotiatedContentResult<T> implements interfaces.IHttpActionResult {
    constructor(private content: T) { }

    public async executeAsync() {
        const response = new HttpResponseMessage(OK);
        response.content = new StringContent(JSON.stringify(this.content), "application/json");
        return response;
    }
}
