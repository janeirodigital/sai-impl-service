import { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import { jest } from '@jest/globals';

import "dotenv/config";

import { RedisStorage } from "../src/redis-storage";
jest.mock('../src/redis-storage')
const MockedRedisStorage = jest.mocked(RedisStorage, true)

import storage, { getClientIdKey, getWebIdKey, uuid2clientId, getCookieSessionIdKey } from '../src/sai-session-storage'

beforeEach(() => {
  MockedRedisStorage.instance.get.mockReset()
  MockedRedisStorage.instance.set.mockReset()
  MockedRedisStorage.instance.delete.mockReset()
})

describe('getWebId', () => {
  test('should return WebID based on ClientId', async () => {
    const webId = 'https://alice.example/'
    const clientId = 'https://sai.example/agents/0a0b5f5c-a352-4d8e-b5f4-d031afff0f23'
    MockedRedisStorage.instance.get.mockImplementation(async (key) => {
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
    MockedRedisStorage.instance.get.mockImplementation(async (key) => {
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
    MockedRedisStorage.instance.get.mockImplementation(async (key) => {
      expect(key).toBe(getClientIdKey(uuid2clientId(uuid)))
      return webId
    })
    const getSpy = jest.spyOn(storage, 'get').mockImplementation(async () => ({} as AuthorizationAgent))
    await storage.getFromUuid(uuid)
    expect(getSpy).toBeCalledTimes(1)
    expect(getSpy).toBeCalledWith(webId)

  })
})

describe('changeKey', () => {
  const sessionKey = 'some-seesion-key'
  const clientId = 'some-client-id'
  const sessionValue = JSON.stringify({ clientId })
  const webId = 'https://alice.example/'
  const oidcSessionValue = JSON.stringify({})

  test('if session does not exist error is thrown', async () => {
    await expect(async () => await storage.changeKey(sessionKey, webId)).rejects.toThrow(`session with id=${sessionKey} does not exist`)
    expect(MockedRedisStorage.instance.get).toBeCalledTimes(1)
    expect(MockedRedisStorage.instance.get).toBeCalledWith(getCookieSessionIdKey(sessionKey))
    expect(MockedRedisStorage.instance.set).not.toBeCalled()
    expect(MockedRedisStorage.instance.delete).not.toBeCalled()

  })

 test('if oidc session exists only deletes cookie session', async () => {
  MockedRedisStorage.instance.get.mockImplementationOnce(async (key) => {
    expect(key).toBe(getCookieSessionIdKey(sessionKey))
    return sessionValue
  })
  MockedRedisStorage.instance.get.mockImplementationOnce(async (key) => {
    expect(key).toBe(getWebIdKey(webId))
    return oidcSessionValue
  })
  await storage.changeKey(sessionKey, webId)
  expect(MockedRedisStorage.instance.get).toBeCalledTimes(2)
  expect(MockedRedisStorage.instance.delete).toBeCalledTimes(1)
  expect(MockedRedisStorage.instance.set).not.toBeCalled()
 })

 test('if oidc sessions does not exists creates new one based on the cookie session', async () => {
  MockedRedisStorage.instance.get.mockImplementationOnce(async (key) => {
    expect(key).toBe(getCookieSessionIdKey(sessionKey))
    return sessionValue
  })
  MockedRedisStorage.instance.get.mockImplementationOnce(async (key) => {
    expect(key).toBe(getWebIdKey(webId))
    return undefined
  })
  MockedRedisStorage.instance.set.mockImplementationOnce(async (key, value) => {
    expect(key).toBe(getWebIdKey(webId))
    expect(value).toBe(sessionValue)
  })
  MockedRedisStorage.instance.set.mockImplementationOnce(async (key, value) => {
    expect(key).toBe(getClientIdKey(clientId))
    expect(value).toBe(webId)
  })
  await storage.changeKey(sessionKey, webId)
  expect(MockedRedisStorage.instance.get).toBeCalledTimes(2)
  expect(MockedRedisStorage.instance.set).toBeCalledTimes(2)
  expect(MockedRedisStorage.instance.delete).toBeCalledTimes(1)
 })
})
