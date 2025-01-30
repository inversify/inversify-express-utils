import { URL } from 'node:url';

import { StatusCodes } from 'http-status-codes';

import { StringContent } from '../content/stringContent';
import { HttpResponseMessage } from '../httpResponseMessage';
import type { IHttpActionResult } from '../interfaces';

export class CreatedNegotiatedContentResult<T> implements IHttpActionResult {
  constructor(
    private readonly location: string | URL,
    private readonly content: T,
  ) {}

  public async executeAsync(): Promise<HttpResponseMessage> {
    const response: HttpResponseMessage = new HttpResponseMessage(
      StatusCodes.CREATED,
    );
    response.content = new StringContent(JSON.stringify(this.content));
    response.headers['location'] = this.location.toString();

    return response;
  }
}
