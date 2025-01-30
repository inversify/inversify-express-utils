import { JsonContent } from '../content/jsonContent';
import { HttpResponseMessage } from '../httpResponseMessage';
import type { IHttpActionResult } from '../interfaces';

export class JsonResult implements IHttpActionResult {
  constructor(
    public readonly json: unknown,
    public readonly statusCode: number,
  ) {}

  public async executeAsync(): Promise<HttpResponseMessage> {
    const response: HttpResponseMessage = new HttpResponseMessage(
      this.statusCode,
    );
    response.content = new JsonContent(this.json);

    return response;
  }
}
