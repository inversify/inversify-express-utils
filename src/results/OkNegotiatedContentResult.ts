import { StatusCodes } from 'http-status-codes';

import { JsonContent } from '../content/jsonContent';
import { StringContent } from '../content/stringContent';
import { HttpResponseMessage } from '../httpResponseMessage';
import type { IHttpActionResult } from '../interfaces';

export class OkNegotiatedContentResult<T> implements IHttpActionResult {
  constructor(private readonly content: T) {}

  public async executeAsync(): Promise<HttpResponseMessage> {
    const response: HttpResponseMessage = new HttpResponseMessage(
      StatusCodes.OK,
    );

    if (typeof this.content === 'string') {
      response.content = new StringContent(this.content);
    } else {
      response.content = new JsonContent(this.content);
    }

    return response;
  }
}
