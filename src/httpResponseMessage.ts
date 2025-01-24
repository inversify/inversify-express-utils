import type { OutgoingHttpHeaders } from 'node:http';

import { StatusCodes } from 'http-status-codes';

import { HttpContent } from './content/httpContent';

const MAX_STATUS_CODE: number = 999;

export class HttpResponseMessage {
  private _content!: HttpContent;

  private _headers: OutgoingHttpHeaders = {};

  private _statusCode!: number;

  constructor(statusCode: number = StatusCodes.OK) {
    this.statusCode = statusCode;
  }

  public get content(): HttpContent {
    return this._content;
  }

  public get headers(): OutgoingHttpHeaders {
    return this._headers;
  }

  public get statusCode(): number {
    return this._statusCode;
  }

  public set content(value: HttpContent) {
    this._content = value;
  }

  public set headers(headers: OutgoingHttpHeaders) {
    this._headers = headers;
  }

  public set statusCode(code: number) {
    if (code < 0 || code > MAX_STATUS_CODE) {
      throw new Error(`${code.toString()} is not a valid status code`);
    }

    this._statusCode = code;
  }
}
