import { StatusCodes } from 'http-status-codes';

import { StringContent } from '../content/stringContent';
import { HttpResponseMessage } from '../httpResponseMessage';
import type { IHttpActionResult } from '../interfaces';

export class OkNegotiatedContentResult<T> implements IHttpActionResult {
  constructor(private readonly content: T) {}

  public async executeAsync(): Promise<HttpResponseMessage> {
    const response: HttpResponseMessage = new HttpResponseMessage(
      StatusCodes.OK,
    );
    response.content = new StringContent(JSON.stringify(this.content));

    return response;
  }
}
