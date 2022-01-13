import {HttpContent} from './httpContent';

const DEFAULT_MEDIA_TYPE = 'application/json';

export class JsonContent extends HttpContent {
    private content: string;

    constructor(content: unknown) {
        super();

        this.content = JSON.stringify(content);

        this.headers['content-type'] = DEFAULT_MEDIA_TYPE;
    }

    public readAsStringAsync(): Promise<string> {
        return Promise.resolve(this.content);
    }
}
