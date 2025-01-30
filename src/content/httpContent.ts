import type { OutgoingHttpHeaders } from 'node:http';

export abstract class HttpContent {
  private readonly _headers: OutgoingHttpHeaders = {};

  public get headers(): OutgoingHttpHeaders {
    return this._headers;
  }

  public abstract readAsync(): Promise<unknown>;
}
