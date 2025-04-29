/* eslint-disable @typescript-eslint/typedef */
import { describe, expect, it } from '@jest/globals';

import { METADATA_KEY } from '../constants';
import { getControllerMethodMetadata } from '../utils';

describe('Utils', () => {
  describe('getControllerMethodMetadata', () => {
    it('should return an empty array when controller has no methods', () => {
      class EmptyController {}

      const result = getControllerMethodMetadata(EmptyController);

      expect(result).toEqual([]);
    });

    it('should return metadata from controller own methods', () => {
      class TestController {}
      const methodMetadata = [
        {
          key: 'get',
          method: 'testMethod',
          middleware: [],
          path: '/test',
          target: TestController,
        },
      ];

      Reflect.defineMetadata(
        METADATA_KEY.controllerMethod,
        methodMetadata,
        TestController,
      );

      const result = getControllerMethodMetadata(TestController);

      expect(result).toEqual(methodMetadata);
    });

    it('should return metadata from inherited methods', () => {
      class BaseController {}
      class ChildController extends BaseController {}

      const genericMetadata = [
        {
          key: 'get',
          method: 'baseMethod',
          middleware: [],
          path: '/base',
          target: BaseController,
        },
      ];

      Reflect.defineMetadata(
        METADATA_KEY.controllerMethod,
        genericMetadata,
        BaseController,
      );

      const result = getControllerMethodMetadata(ChildController);

      expect(result).toEqual(genericMetadata);
    });

    it('should concatenate own and inherited metadata', () => {
      class BaseController {}
      class ChildController extends BaseController {}

      const ownMetadata = [
        {
          key: 'post',
          method: 'childMethod',
          middleware: [],
          path: '/child',
          target: ChildController,
        },
      ];

      const genericMetadata = [
        {
          key: 'get',
          method: 'baseMethod',
          middleware: [],
          path: '/base',
          target: BaseController,
        },
      ];

      Reflect.defineMetadata(
        METADATA_KEY.controllerMethod,
        ownMetadata,
        ChildController,
      );

      Reflect.defineMetadata(
        METADATA_KEY.controllerMethod,
        genericMetadata,
        BaseController,
      );

      const result = getControllerMethodMetadata(ChildController);

      expect(result).toEqual([...ownMetadata, ...genericMetadata]);
    });

    it('should handle undefined metadata correctly', () => {
      class TestController {}
      const result = getControllerMethodMetadata(TestController);
      expect(result).toEqual([]);
    });
  });
});
