import {StatusCodes} from 'http-status-codes';
import {URL} from 'url';
import {HttpResponseMessage} from '../httpResponseMessage';
import {IHttpActionResult} from '../interfaces';

export class RedirectResult implements IHttpActionResult {
    constructor(private location: string | URL) { }

    public async executeAsync(): Promise<HttpResponseMessage> {
        const response = new HttpResponseMessage(StatusCodes.MOVED_TEMPORARILY);
        response.headers['location'] = this.location.toString();
        return response;
    }
}
