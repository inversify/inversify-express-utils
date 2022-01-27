import { StatusCodes } from 'http-status-codes';
import { HttpResponseMessage } from '../httpResponseMessage';
import type { IHttpActionResult } from '../interfaces';

export class BadRequestResult implements IHttpActionResult {
  public async executeAsync(): Promise<HttpResponseMessage> {
    return Promise.resolve(new HttpResponseMessage(StatusCodes.BAD_REQUEST));
  }
}
