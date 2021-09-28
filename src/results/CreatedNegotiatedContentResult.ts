import {StatusCodes} from 'http-status-codes';
import {URL} from 'url';
import {HttpResponseMessage} from '../httpResponseMessage';
import {StringContent} from '../content/stringContent';
import {IHttpActionResult} from '../interfaces';

export class CreatedNegotiatedContentResult<T> implements IHttpActionResult {
    constructor(private location: string | URL, private content: T) { }

    public async executeAsync(): Promise<HttpResponseMessage> {
        const response = new HttpResponseMessage(StatusCodes.CREATED);
        response.content = new StringContent(JSON.stringify(this.content));
        response.headers['location'] = this.location.toString();
        return response;
    }
}
