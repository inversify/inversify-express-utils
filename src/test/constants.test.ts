import { describe, expect, it } from '@jest/globals';

import { DUPLICATED_CONTROLLER_NAME } from '../constants';

describe('Constants test', () => {
  it('should return correct message', () => {
    expect(DUPLICATED_CONTROLLER_NAME('test')).toBe(
      'Two controllers cannot have the same name: test',
    );
  });
});
