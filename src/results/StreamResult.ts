import * as stream from "stream";
import { BaseHttpController } from "../base_http_controller";
import { interfaces } from "../interfaces";
import { HttpResponseMessage } from "../httpResponseMessage";
import { StreamContent } from "../content/streamContent";

export class StreamResult implements interfaces.IHttpActionResult {
    constructor(
        public readableStream: stream.Readable,
        public contentType: string,
        public readonly statusCode: number,
        private apiController?: BaseHttpController) {
    }

    public async executeAsync() {
        const response = new HttpResponseMessage(this.statusCode);
        response.content = new StreamContent(this.readableStream, this.contentType);
        return response;
    }
}
