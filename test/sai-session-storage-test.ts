import { jest } from '@jest/globals';

import "dotenv/config";

import { RedisStorage } from "../src/redis-storage";
jest.mock('../src/redis-storage')
import storage, { getClientIdKey, getWebIdKey, uuid2clientId } from '../src/sai-session-storage'

describe('getWebId', () => {
  test('should return WebID based on ClientId', async () => {
    const webId = 'https://alice.example/'
    const clientId = 'https://sai.example/agents/0a0b5f5c-a352-4d8e-b5f4-d031afff0f23'
    // @ts-ignore
    RedisStorage.instance.get.mockImplementation((key) => {
      expect(key).toBe(getClientIdKey(clientId))
      return webId
    })
    expect(await storage.getWebId(clientId)).toEqual(webId)
  })
})

describe('getClientId', () => {
  test('should return ClientId based on WebID', async () => {
    const webId = 'https://alice.example/'
    const clientId = 'https://sai.example/agents/0a0b5f5c-a352-4d8e-b5f4-d031afff0f23'
    // @ts-ignore
    RedisStorage.instance.get.mockImplementation((key) => {
      expect(key).toBe(getWebIdKey(webId))
      return JSON.stringify({ clientId })
    })
    expect(await storage.getClientId(webId)).toEqual(clientId)
  })
})

describe('getFromUuid', () => {
  test('should try to get using correct WebId', async () => {
    const uuid = '8c4b1081-bc98-44ef-af57-271bac06d95f'
    const webId = 'https://alice.example/'
    // @ts-ignore
    RedisStorage.instance.get.mockImplementation((key) => {
      expect(key).toBe(getClientIdKey(uuid2clientId(uuid)))
      return webId
    })
    // @ts-ignore
    const getSpy = jest.spyOn(storage, 'get').mockImplementation(() => ({}))
    await storage.getFromUuid(uuid)
    expect(getSpy).toBeCalledTimes(1)
    expect(getSpy).toBeCalledWith(webId)

  })
})
