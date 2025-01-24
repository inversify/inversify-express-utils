import { HttpResponseMessage } from '../httpResponseMessage';
import type { IHttpActionResult } from '../interfaces';

export class StatusCodeResult implements IHttpActionResult {
  constructor(private readonly statusCode: number) {}

  public async executeAsync(): Promise<HttpResponseMessage> {
    return new HttpResponseMessage(this.statusCode);
  }
}
