import { HttpContent } from './httpContent';

const DEFAULT_MEDIA_TYPE = 'text/plain';

export class StringContent extends HttpContent {
  constructor(private content: string) {
    super();

    this.headers['content-type'] = DEFAULT_MEDIA_TYPE;
  }

  public readAsync(): Promise<string> {
    return Promise.resolve(this.content);
  }
}
