import { jest } from '@jest/globals';
import 'dotenv/config';
import { Session } from '@inrupt/solid-client-authn-node';
import { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
jest.mock('@janeirodigital/interop-authorization-agent');

const MockedAuthorizationAgent = AuthorizationAgent as jest.MockedFunction<any>

import { RedisStorage } from '../src/redis-storage';
jest.mock('../src/redis-storage');
const MockedRedisStorage = jest.mocked(RedisStorage, true);

import { getSessionFromStorage } from '@inrupt/solid-client-authn-node';
jest.mock('@inrupt/solid-client-authn-node');

const mockedGetSessionFromStorage = getSessionFromStorage as jest.MockedFunction<any>;

import {storage, getClientIdKey, getWebIdKey, uuid2clientId, getCookieSessionIdKey } from '../src/sai-session-storage';

beforeEach(() => {
  MockedRedisStorage.instance.get.mockReset();
  MockedRedisStorage.instance.set.mockReset();
  MockedRedisStorage.instance.delete.mockReset();
  mockedGetSessionFromStorage.mockReset();
  storage.clearCache()
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('getWebId', () => {
  test('should return WebID based on ClientId', async () => {
    const webId = 'https://alice.example/';
    const clientId = 'https://sai.example/agents/0a0b5f5c-a352-4d8e-b5f4-d031afff0f23';
    MockedRedisStorage.instance.get.mockImplementation(async (key) => {
      expect(key).toBe(getClientIdKey(clientId));
      return webId;
    });
    expect(await storage.getWebId(clientId)).toEqual(webId);
  });
});

describe('getClientId', () => {
  test('should return ClientId based on WebID', async () => {
    const webId = 'https://alice.example/';
    const clientId = 'https://sai.example/agents/0a0b5f5c-a352-4d8e-b5f4-d031afff0f23';
    MockedRedisStorage.instance.get.mockImplementation(async (key) => {
      expect(key).toBe(getWebIdKey(webId));
      return JSON.stringify({ clientId });
    });
    expect(await storage.getClientId(webId)).toEqual(clientId);
  });
  test('should return undefined when using unregistered webId', async () => {
    const webId = 'https://alice.example/';
    MockedRedisStorage.instance.get.mockImplementation(async (key) => {
      return undefined
    });
    const undefinedClientId = await storage.getClientId(webId);
    expect(undefinedClientId).toBeUndefined()
  });
});

describe('getFromUuid', () => {
  test('should try to get using correct WebId', async () => {
    const uuid = '8c4b1081-bc98-44ef-af57-271bac06d95f';
    const webId = 'https://alice.example/';
    MockedRedisStorage.instance.get.mockImplementation(async (key) => {
      expect(key).toBe(getClientIdKey(uuid2clientId(uuid)));
      return webId;
    });
    const getSpy = jest.spyOn(storage, 'get').mockImplementationOnce(async () => ({} as AuthorizationAgent));
    await storage.getFromUuid(uuid);
    expect(getSpy).toBeCalledTimes(1);
    expect(getSpy).toBeCalledWith(webId);
  });

  test('should return undefined when using unregistered clientId', async () => {
    const uuid = 'fff8be42-8946-4759-b758-40a026ac7a06';
    MockedRedisStorage.instance.get.mockImplementation(async (key) => {
      return undefined
    });
    const authAgent = await storage.getFromUuid(uuid);
    expect(authAgent).toBeUndefined()
  });
});

describe('changeKey', () => {
  const sessionKey = 'some-seesion-key';
  const clientId = 'some-client-id';
  const sessionValue = JSON.stringify({ clientId });
  const webId = 'https://alice.example/';
  const oidcSessionValue = JSON.stringify({});

  test('if session does not exist error is thrown', async () => {
    await expect(async () => await storage.changeKey(sessionKey, webId)).rejects.toThrow(
      `session with id=${sessionKey} does not exist`
    );
    expect(MockedRedisStorage.instance.get).toBeCalledTimes(1);
    expect(MockedRedisStorage.instance.get).toBeCalledWith(getCookieSessionIdKey(sessionKey));
    expect(MockedRedisStorage.instance.set).not.toBeCalled();
    expect(MockedRedisStorage.instance.delete).not.toBeCalled();
  });

  test('if oidc session exists only deletes cookie session', async () => {
    MockedRedisStorage.instance.get.mockImplementationOnce(async (key) => {
      expect(key).toBe(getCookieSessionIdKey(sessionKey));
      return sessionValue;
    });
    MockedRedisStorage.instance.get.mockImplementationOnce(async (key) => {
      expect(key).toBe(getWebIdKey(webId));
      return oidcSessionValue;
    });
    await storage.changeKey(sessionKey, webId);
    expect(MockedRedisStorage.instance.get).toBeCalledTimes(2);
    expect(MockedRedisStorage.instance.delete).toBeCalledTimes(1);
    expect(MockedRedisStorage.instance.set).not.toBeCalled();
  });

  test('if oidc sessions does not exists creates new one based on the cookie session', async () => {
    MockedRedisStorage.instance.get.mockImplementationOnce(async (key) => {
      expect(key).toBe(getCookieSessionIdKey(sessionKey));
      return sessionValue;
    });
    MockedRedisStorage.instance.get.mockImplementationOnce(async (key) => {
      expect(key).toBe(getWebIdKey(webId));
      return undefined;
    });
    MockedRedisStorage.instance.set.mockImplementationOnce(async (key, value) => {
      expect(key).toBe(getWebIdKey(webId));
      expect(value).toBe(sessionValue);
    });
    MockedRedisStorage.instance.set.mockImplementationOnce(async (key, value) => {
      expect(key).toBe(getClientIdKey(clientId));
      expect(value).toBe(webId);
    });
    await storage.changeKey(sessionKey, webId);
    expect(MockedRedisStorage.instance.get).toBeCalledTimes(2);
    expect(MockedRedisStorage.instance.set).toBeCalledTimes(2);
    expect(MockedRedisStorage.instance.delete).toBeCalledTimes(1);
  });
});

describe('get', () => {
  test('creates sai session', async () => {
    const webId = 'https://user.example/'
    const clientId = 'https://aa.example/'
    const oidcSession = {
      info: { webId },
      fetch: () => {}
    } as unknown as Session
    mockedGetSessionFromStorage.mockImplementationOnce((webId: string, iStorage: Storage) => {
      expect(webId).toBe(webId)
      expect(iStorage).toBe(MockedRedisStorage.instance)
      return oidcSession
    });
    const authAgent = {} as unknown as AuthorizationAgent
    MockedAuthorizationAgent.build.mockImplementationOnce((webid: string, agentid: string, dependencies: {fetch: Function}) => {
      expect(webid).toBe(webId)
      expect(agentid).toBe(clientId)
      expect(dependencies.fetch).toBe(oidcSession.fetch)

      return authAgent
    })
    const getClientIdSpy = jest.spyOn(storage, 'getClientId').mockImplementationOnce(async (webid: string) => {
      expect(webid).toBe(webId)
      return clientId
    })

    const saiSession = await storage.get(webId) as AuthorizationAgent
    expect(saiSession).toBe(authAgent)

    const cachedSession = await storage.get(webId) as AuthorizationAgent
    expect(cachedSession).toBe(authAgent)
  })
})
