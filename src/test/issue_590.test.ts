import { beforeEach, describe, expect, it } from '@jest/globals';
import { Application } from 'express';
import { Container } from 'inversify';

import { NO_CONTROLLERS_FOUND } from '../constants';
import { InversifyExpressServer } from '../server';
import { cleanUpMetadata } from '../utils';

describe('Issue 590', () => {
  beforeEach(() => {
    cleanUpMetadata();
  });

  it('should throw if no bindings for controllers are declared', () => {
    const container: Container = new Container();
    const server: InversifyExpressServer = new InversifyExpressServer(
      container,
    );
    const throws: () => Application = (): Application => server.build();
    expect(throws).toThrowError(NO_CONTROLLERS_FOUND);
  });

  it('should not throw if forceControllers is false and no bindings for controllers are declared', () => {
    const container: Container = new Container();
    const server: InversifyExpressServer = new InversifyExpressServer(
      container,
      null,
      null,
      null,
      null,
      false,
    );
    const throws: () => Application = (): Application => server.build();
    expect(throws).not.toThrowError();
  });
});
