import { StatusCodes } from 'http-status-codes';
import { HttpResponseMessage } from '../httpResponseMessage';
import { StringContent } from '../content/stringContent';
import type { IHttpActionResult } from '../interfaces';

export class OkNegotiatedContentResult<T> implements IHttpActionResult {
  constructor(private content: T) { }

  public async executeAsync(): Promise<HttpResponseMessage> {
    const response = new HttpResponseMessage(StatusCodes.OK);
    response.content = new StringContent(JSON.stringify(this.content));
    return Promise.resolve(response);
  }
}
