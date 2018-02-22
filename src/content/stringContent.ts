import { HttpContent } from "./httpContent";

const DEFAULT_MEDIA_TYPE = "text/plain";

export class StringContent extends HttpContent {
  constructor(content: string);
  constructor(content: string, mediaType: string);
  constructor(private content: string, private mediaType: string = DEFAULT_MEDIA_TYPE) {
    super();

    this.headers["content-type"] = mediaType;
  }

  public readAsStringAsync() {
    return Promise.resolve(this.content);
  }
}
