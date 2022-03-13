import { StatusCodes } from 'http-status-codes';
import { HttpResponseMessage } from '../httpResponseMessage';
import type { IHttpActionResult } from '../interfaces';

export class ConflictResult implements IHttpActionResult {
  public async executeAsync(): Promise<HttpResponseMessage> {
    return Promise.resolve(new HttpResponseMessage(StatusCodes.CONFLICT));
  }
}
