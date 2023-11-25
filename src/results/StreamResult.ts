import { Readable } from 'stream';
import { IHttpActionResult } from '../interfaces';
import { HttpResponseMessage } from '../httpResponseMessage';
import { StreamContent } from '../content/streamContent';


export class StreamResult implements IHttpActionResult {
  constructor(
    public readableStream: Readable,
    public contentType: string,
    public readonly statusCode: number
  ) { }

  public async executeAsync(): Promise<HttpResponseMessage> {
    const response = new HttpResponseMessage(this.statusCode);
    response.content = new StreamContent(
      this.readableStream,
      this.contentType,
    );
    return Promise.resolve(response);
  }
}
