import {StatusCodes} from 'http-status-codes';
import {HttpResponseMessage} from '../httpResponseMessage';
import {IHttpActionResult} from '../interfaces';

export class NotFoundResult implements IHttpActionResult {
    public async executeAsync(): Promise<HttpResponseMessage> {
        return new HttpResponseMessage(StatusCodes.NOT_FOUND);
    }
}
