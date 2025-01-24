import { HttpContent } from './httpContent';

const DEFAULT_MEDIA_TYPE: string = 'text/plain';

export class StringContent extends HttpContent {
  constructor(private readonly content: string) {
    super();

    this.headers['content-type'] = DEFAULT_MEDIA_TYPE;
  }

  public async readAsync(): Promise<string> {
    return this.content;
  }
}
