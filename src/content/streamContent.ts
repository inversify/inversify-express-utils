import { Readable } from 'node:stream';

import { HttpContent } from './httpContent';

export class StreamContent extends HttpContent {
  constructor(
    private readonly content: Readable,
    mediaType: string,
  ) {
    super();

    this.headers['content-type'] = mediaType;
  }
  public async readAsync(): Promise<Readable> {
    return this.content;
  }
}
