import {HttpResponseMessage} from '../httpResponseMessage';
import {JsonContent} from '../content/jsonContent';
import {IHttpActionResult} from '../interfaces';

export class JsonResult implements IHttpActionResult {
    constructor(public readonly json: any, public readonly statusCode: number) { }

    public async executeAsync(): Promise<HttpResponseMessage> {
        const response = new HttpResponseMessage(this.statusCode);
        response.content = new JsonContent(this.json);
        return response;
    }
}
