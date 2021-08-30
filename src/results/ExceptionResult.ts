import {StatusCodes} from 'http-status-codes';
import {HttpResponseMessage} from '../httpResponseMessage';
import {StringContent} from '../content/stringContent';
import {IHttpActionResult} from '../interfaces';

export class ExceptionResult implements IHttpActionResult {
    constructor(private error: Error) { }

    public async executeAsync(): Promise<HttpResponseMessage> {
        const response = new HttpResponseMessage(StatusCodes.INTERNAL_SERVER_ERROR);
        response.content = new StringContent(this.error.toString());
        return response;
    }
}
