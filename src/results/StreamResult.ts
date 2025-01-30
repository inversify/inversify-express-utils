import { Readable } from 'node:stream';

import { StreamContent } from '../content/streamContent';
import { HttpResponseMessage } from '../httpResponseMessage';
import { IHttpActionResult } from '../interfaces';

export class StreamResult implements IHttpActionResult {
  constructor(
    public readableStream: Readable,
    public contentType: string,
    public readonly statusCode: number,
  ) {}

  public async executeAsync(): Promise<HttpResponseMessage> {
    const response: HttpResponseMessage = new HttpResponseMessage(
      this.statusCode,
    );

    response.content = new StreamContent(this.readableStream, this.contentType);

    return response;
  }
}
