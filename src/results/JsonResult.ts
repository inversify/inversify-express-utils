import { JsonContent } from '../content/jsonContent';
import { HttpResponseMessage } from '../httpResponseMessage';
import type { IHttpActionResult } from '../interfaces';

export class JsonResult<T extends Record<string, unknown>>
  implements IHttpActionResult
{
  constructor(
    public readonly json: T | T[],
    public readonly statusCode: number,
  ) {}

  public async executeAsync(): Promise<HttpResponseMessage> {
    const response: HttpResponseMessage = new HttpResponseMessage(
      this.statusCode,
    );
    response.content = new JsonContent<T>(this.json);

    return response;
  }
}
