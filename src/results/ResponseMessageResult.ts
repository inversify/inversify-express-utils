import { HttpResponseMessage } from '../httpResponseMessage';
import type { IHttpActionResult } from '../interfaces';

export class ResponseMessageResult implements IHttpActionResult {
  constructor(private message: HttpResponseMessage) { }

  public async executeAsync(): Promise<HttpResponseMessage> {
    return Promise.resolve(this.message);
  }
}
