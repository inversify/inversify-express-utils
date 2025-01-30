import { HttpContent } from './httpContent';

const DEFAULT_MEDIA_TYPE: string = 'application/json';

export class JsonContent<
  T extends Record<string, unknown>,
> extends HttpContent {
  constructor(private readonly content: T | T[]) {
    super();

    this.headers['content-type'] = DEFAULT_MEDIA_TYPE;
  }

  public async readAsync(): Promise<T | T[]> {
    return this.content;
  }
}
