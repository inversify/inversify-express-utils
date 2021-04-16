import { OutgoingHttpHeaders } from "http";

export abstract class HttpContent {

  public get headers() {
    return this._headers;
  }

  public isStreamedResponse = false;
  private _headers: OutgoingHttpHeaders = {};

  public abstract readAsStringAsync(): Promise<string>;
}
