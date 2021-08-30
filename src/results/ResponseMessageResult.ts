import {HttpResponseMessage} from '../httpResponseMessage';
import {IHttpActionResult} from '../interfaces';

export class ResponseMessageResult implements IHttpActionResult {
    constructor(private message: HttpResponseMessage) { }

    public async executeAsync(): Promise<HttpResponseMessage> {
        return this.message;
    }
}
