import { interfaces } from "../interfaces";
import { HttpResponseMessage } from "../httpResponseMessage";
import { JsonContent } from "../content/jsonContent";

export default class JsonResult implements interfaces.IHttpActionResult {

  constructor(public readonly json: any, public readonly statusCode: number) { }

  public async executeAsync() {
    const response = new HttpResponseMessage(this.statusCode);
    response.content = new JsonContent(this.json);
    return response;
  }

}
