import {JsonContent} from '../../src/content/jsonContent';

describe('JsonContent', () => {
    it('should have application/json as the default media type', () => {
        const content = new JsonContent({});
        expect(content.headers['content-type']).toBe('application/json');
    });

    it('should respond with the stringified version of the object', done => {
        const mockObject = {
            type: 'fake',
            success: true,
            count: 6,
        };

        const content = new JsonContent(mockObject);

        content.readAsStringAsync().then(value => {
            expect(value).toBe(JSON.stringify(mockObject));
            done();
        });
    });
});
