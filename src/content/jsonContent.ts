import { HttpContent } from './httpContent';

const DEFAULT_MEDIA_TYPE = 'application/json';

export class JsonContent extends HttpContent {
  constructor(private content: Record<string, unknown>) {
    super();

    this.headers['content-type'] = DEFAULT_MEDIA_TYPE;
  }

  public readAsync(): Promise<Record<string, unknown>> {
    return Promise.resolve(this.content);
  }
}
