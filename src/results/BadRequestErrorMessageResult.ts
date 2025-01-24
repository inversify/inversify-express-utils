import { StatusCodes } from 'http-status-codes';

import { StringContent } from '../content/stringContent';
import { HttpResponseMessage } from '../httpResponseMessage';
import type { IHttpActionResult } from '../interfaces';

export class BadRequestErrorMessageResult implements IHttpActionResult {
  constructor(private readonly message: string) {}

  public async executeAsync(): Promise<HttpResponseMessage> {
    const response: HttpResponseMessage = new HttpResponseMessage(
      StatusCodes.BAD_REQUEST,
    );
    response.content = new StringContent(this.message);

    return response;
  }
}
