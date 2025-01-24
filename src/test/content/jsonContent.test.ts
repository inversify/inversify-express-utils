import { describe, expect, it } from '@jest/globals';

import { JsonContent } from '../../content/jsonContent';

describe('JsonContent', () => {
  it('should have application/json as the default media type', () => {
    const content: JsonContent<Record<string, unknown>> = new JsonContent({});
    expect(content.headers['content-type']).toBe('application/json');
  });

  it('should respond with the original object', async () => {
    const mockObject: Record<string, unknown> = {
      count: 6,
      success: true,
      type: 'fake',
    };

    const content: unknown = await new JsonContent(mockObject).readAsync();

    expect(content).toBe(mockObject);
  });
});
