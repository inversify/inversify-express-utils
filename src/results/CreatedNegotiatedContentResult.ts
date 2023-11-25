import { StatusCodes } from 'http-status-codes';
import { URL } from 'node:url';
import { HttpResponseMessage } from '../httpResponseMessage';
import { StringContent } from '../content/stringContent';
import type { IHttpActionResult } from '../interfaces';

export class CreatedNegotiatedContentResult<T> implements IHttpActionResult {
  constructor(private location: string | URL, private content: T) { }

  public async executeAsync(): Promise<HttpResponseMessage> {
    const response = new HttpResponseMessage(StatusCodes.CREATED);
    response.content = new StringContent(JSON.stringify(this.content));
    response.headers['location'] = this.location.toString();
    return Promise.resolve(response);
  }
}
