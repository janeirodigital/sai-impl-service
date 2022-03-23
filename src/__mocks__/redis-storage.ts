import { jest } from '@jest/globals';

export const RedisStorage = {
  instance: {
    get: jest.fn(),
    set: jest.fn(),
    delete:jest.fn()
  }
}
