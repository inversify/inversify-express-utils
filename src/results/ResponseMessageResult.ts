import { HttpResponseMessage } from '../httpResponseMessage';
import type { IHttpActionResult } from '../interfaces';

export class ResponseMessageResult implements IHttpActionResult {
  constructor(private readonly message: HttpResponseMessage) {}

  public async executeAsync(): Promise<HttpResponseMessage> {
    return this.message;
  }
}
