import { HttpContent } from './httpContent';

const DEFAULT_MEDIA_TYPE = 'application/json';

export class JsonContent<
  T extends Record<string, unknown>
> extends HttpContent {
  constructor(private content: T) {
    super();

    this.headers['content-type'] = DEFAULT_MEDIA_TYPE;
  }

  public readAsync(): Promise<T> {
    return Promise.resolve(this.content);
  }
}
