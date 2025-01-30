import { HttpContent } from './httpContent';

const DEFAULT_MEDIA_TYPE: string = 'application/json';

export class JsonContent extends HttpContent {
  constructor(private readonly content: unknown) {
    super();

    this.headers['content-type'] = DEFAULT_MEDIA_TYPE;
  }

  public async readAsync(): Promise<unknown> {
    return this.content;
  }
}
