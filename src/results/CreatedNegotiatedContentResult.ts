import { HttpResponseMessage } from "../httpResponseMessage";
import { CREATED } from "http-status-codes";
import { interfaces } from "../interfaces";
import { URL } from "url";
import { BaseHttpController } from "../base_http_controller";
import { StringContent } from "../content/stringContent";

export default class CreatedNegotiatedContentResult<T> implements interfaces.IHttpActionResult {
    constructor(private location: string | URL, private content: T, private apiController: BaseHttpController) {}

    public async executeAsync() {
        const response = new HttpResponseMessage(CREATED);
        response.content = new StringContent(JSON.stringify(this.content), "application/json");
        response.headers.location = this.location.toString();
        return response;
    }
}
