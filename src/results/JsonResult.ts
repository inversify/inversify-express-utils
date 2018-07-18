import { interfaces } from "../interfaces";
import { HttpResponseMessage } from "../httpResponseMessage";
import { JsonContent } from "../content/jsonContent";
import { BaseHttpController } from "../base_http_controller";

export default class JsonResult implements interfaces.IHttpActionResult {

  constructor(
    public readonly json: any,
    public readonly statusCode: number,
    private apiController: BaseHttpController) {}

  public async executeAsync() {
    const response = new HttpResponseMessage(this.statusCode);
    response.content = new JsonContent(this.json);
    return response;
  }

}
