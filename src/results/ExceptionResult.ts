import { StatusCodes } from 'http-status-codes';

import { StringContent } from '../content/stringContent';
import { HttpResponseMessage } from '../httpResponseMessage';
import type { IHttpActionResult } from '../interfaces';

export class ExceptionResult implements IHttpActionResult {
  constructor(private readonly error: Error) {}

  public async executeAsync(): Promise<HttpResponseMessage> {
    const response: HttpResponseMessage = new HttpResponseMessage(
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
    response.content = new StringContent(this.error.toString());

    return response;
  }
}
