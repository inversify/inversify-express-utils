import { StatusCodes } from 'http-status-codes';
import { HttpResponseMessage } from '../httpResponseMessage';
import { StringContent } from '../content/stringContent';
import type { IHttpActionResult } from '../interfaces';

export class BadRequestErrorMessageResult implements IHttpActionResult {
  constructor(private message: string) { }

  public async executeAsync(): Promise<HttpResponseMessage> {
    const response = new HttpResponseMessage(StatusCodes.BAD_REQUEST);
    response.content = new StringContent(this.message);
    return Promise.resolve(response);
  }
}
