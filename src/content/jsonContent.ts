import { HttpContent } from './httpContent';

const DEFAULT_MEDIA_TYPE = 'application/json';

export class JsonContent extends HttpContent {
  constructor(private content: object) {
    super();

    this.headers['content-type'] = DEFAULT_MEDIA_TYPE;
  }

  public readAsync(): Promise<object> {
    return Promise.resolve(this.content);
  }
}
