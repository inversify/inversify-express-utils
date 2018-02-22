import { OutgoingHttpHeaders } from "http";

export abstract class HttpContent {
  private _headers: OutgoingHttpHeaders = {};

  public get headers() {
    return this._headers;
  }

  public abstract readAsStringAsync(): Promise<string>;
}
