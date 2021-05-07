import { HttpContent } from "./httpContent";

const DEFAULT_MEDIA_TYPE = "application/json";

export class JsonContent extends HttpContent {
  private content: string;

  constructor(content: any);
  constructor(content: any, mediaType: string);
  constructor(content: any, mediaType: string = DEFAULT_MEDIA_TYPE) {
    super();

    this.content = JSON.stringify(content);

    this.headers["content-type"] = mediaType;
  }

  public readAsStringAsync() {
    return Promise.resolve(this.content);
  }
}
