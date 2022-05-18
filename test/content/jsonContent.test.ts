import { JsonContent } from '../../src/content/jsonContent';

describe('JsonContent', () => {
  it('should have application/json as the default media type', () => {
    const content = new JsonContent({});
    expect(content.headers['content-type']).toBe('application/json');
  });

  it('should respond with the original object', done => {
    const mockObject = {
      count: 6,
      success: true,
      type: 'fake'
    };

    const content = new JsonContent(mockObject);

    void content.readAsync().then(value => {
      expect(value).toBe(mockObject);
      done();
    });
  });
});
