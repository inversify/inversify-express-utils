import { StatusCodes } from 'http-status-codes';

import { HttpResponseMessage } from '../httpResponseMessage';
import type { IHttpActionResult } from '../interfaces';

export class InternalServerErrorResult implements IHttpActionResult {
  public async executeAsync(): Promise<HttpResponseMessage> {
    return new HttpResponseMessage(StatusCodes.INTERNAL_SERVER_ERROR);
  }
}
