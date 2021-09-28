import {HttpResponseMessage} from '../httpResponseMessage';
import {IHttpActionResult} from '../interfaces';

export class StatusCodeResult implements IHttpActionResult {
    constructor(private statusCode: number) { }

    public async executeAsync(): Promise<HttpResponseMessage> {
        return new HttpResponseMessage(this.statusCode);
    }
}
