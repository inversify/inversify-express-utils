import { URL } from 'node:url';

import { StatusCodes } from 'http-status-codes';

import { HttpResponseMessage } from '../httpResponseMessage';
import type { IHttpActionResult } from '../interfaces';

export class RedirectResult implements IHttpActionResult {
  constructor(private readonly location: string | URL) {}

  public async executeAsync(): Promise<HttpResponseMessage> {
    const response: HttpResponseMessage = new HttpResponseMessage(
      StatusCodes.MOVED_TEMPORARILY,
    );
    response.headers['location'] = this.location.toString();

    return response;
  }
}
