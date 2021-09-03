import {expect} from 'chai';
import {JsonContent} from '../../src/content/jsonContent';

describe('JsonContent', () => {
    it('should have application/json as the default media type', () => {
        const content = new JsonContent({});
        expect(content.headers['content-type']).to.equal('application/json');
    });

    it('should respond with the stringified version of the object', done => {
        const mockObject = {
            type: 'fake',
            success: true,
            count: 6,
        };

        const content = new JsonContent(mockObject);

        content.readAsStringAsync().then(value => {
            expect(value).to.equal(JSON.stringify(mockObject));
            done();
        });
    });
});
