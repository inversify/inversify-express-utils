import { Readable } from 'stream';
import { HttpContent } from './httpContent';

export class StreamContent extends HttpContent {
    constructor(private readonly content: Readable, private mediaType: string) {
        super();

        this.headers['content-type'] = mediaType;
    }
    readAsync(): Promise<Readable> {
        return Promise.resolve(this.content);
    }
}
