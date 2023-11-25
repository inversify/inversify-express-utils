import { HttpResponseMessage } from '../httpResponseMessage';
import type { IHttpActionResult } from '../interfaces';

export class StatusCodeResult implements IHttpActionResult {
  constructor(private statusCode: number) { }

  public async executeAsync(): Promise<HttpResponseMessage> {
    return Promise.resolve(
      new HttpResponseMessage(this.statusCode)
    );
  }
}
