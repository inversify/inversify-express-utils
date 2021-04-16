import { HttpContent } from "./httpContent";
import * as stream from "stream";

export class StreamContent extends HttpContent {
    public isStreamedResponse = true;

    constructor(private readonly content: stream.Readable, private mediaType: string) {
        super();

        this.headers["content-type"] = mediaType;
    }

    public readAsStringAsync() {
        return Promise.resolve("");
    }

    public readAsStreamAsync() {
        return Promise.resolve(this.content);
    }
}
