import { jest } from '@jest/globals';
import { InMemoryStorage, IStorage, Session } from '@inrupt/solid-client-authn-node';

import { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
jest.mock('@janeirodigital/interop-authorization-agent');
const MockedAuthorizationAgent = AuthorizationAgent as jest.MockedFunction<any>

import { getSessionFromStorage } from '@inrupt/solid-client-authn-node';
jest.mock('@inrupt/solid-client-authn-node', () => {
  const originalModule = jest.requireActual('@inrupt/solid-client-authn-node') as object;

  return {
    ...originalModule,
    getSessionFromStorage: jest.fn()
  }
})
const mockedGetSessionFromStorage = getSessionFromStorage as jest.MockedFunction<any>;

import { SessionManager, getAgentUrlKey, getWebIdKey } from '../../src/session-manager';
import { uuid2agentUrl } from '../../src/url-templates'

let manager: SessionManager
let storage: IStorage

beforeEach(() => {
  storage = new InMemoryStorage()
  manager = new SessionManager(storage)
  mockedGetSessionFromStorage.mockReset();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('getWebId', () => {
  test('should return WebID based on ClientId', async () => {
    const webId = 'https://alice.example/';
    const clientId = 'https://sai.example/agents/0a0b5f5c-a352-4d8e-b5f4-d031afff0f23';
    storage.set(getAgentUrlKey(clientId), webId)
    expect(await manager.getWebId(clientId)).toEqual(webId);
  });
});

describe('getFromAgentUrl', () => {
  test('should try to get using correct WebId', async () => {
    const uuid = '8c4b1081-bc98-44ef-af57-271bac06d95f';
    const agentUrl = uuid2agentUrl(uuid)
    const webId = 'https://alice.example/';
    storage.set(getAgentUrlKey(agentUrl), webId)
    const getSpy = jest.spyOn(manager, 'getSaiSession').mockImplementationOnce(async () => ({} as AuthorizationAgent));
    await manager.getFromAgentUrl(agentUrl);
    expect(getSpy).toBeCalledTimes(1);
    expect(getSpy).toBeCalledWith(webId);
  });

  test('should return undefined when using unregistered clientId', async () => {
    const uuid = 'fff8be42-8946-4759-b758-40a026ac7a06';
    const agentUrl = uuid2agentUrl(uuid)
    const authAgent = await manager.getFromAgentUrl(agentUrl);
    expect(authAgent).toBeUndefined()
  });
});

describe('getSaiSession', () => {
  test('creates sai session', async () => {
    const webId = 'https://user.example/'
    const clientId = 'https://aa.example/'
    const oidcSession = {
      info: { webId, sessionId: webId },
      fetch: () => {}
    } as unknown as Session

    // set expected mapping in storage
    storage.set(getWebIdKey(webId), clientId)

    mockedGetSessionFromStorage.mockImplementationOnce((webId: string, iStorage: Storage) => {
      return oidcSession
    });
    const authAgent = {} as unknown as AuthorizationAgent
    MockedAuthorizationAgent.build.mockImplementationOnce((webid: string, agentid: string, dependencies: {fetch: Function}) => {
      expect(webid).toBe(webId)
      expect(agentid).toBe(clientId)
      expect(dependencies.fetch).toBe(oidcSession.fetch)

      return authAgent
    })

    const saiSession = await manager.getSaiSession(webId) as AuthorizationAgent
    expect(saiSession).toBe(authAgent)

    const cachedSession = await manager.getSaiSession(webId) as AuthorizationAgent
    expect(cachedSession).toBe(authAgent)
  })
})

describe('getOidcSession', () => {
  test('should return existing oidc session', async () => {
    const webId = 'https://user.example/'
    const oidcSession = {
      info: { webId },
      fetch: () => {}
    } as unknown as Session

    mockedGetSessionFromStorage.mockImplementationOnce((webId: string, iStorage: Storage) => {
      return oidcSession
    });
    expect(await manager.getOidcSession(webId)).toBe(oidcSession)
  });

  test('should return a new oidc session if none exist', async () => {
    const webId = 'https://user.example/'

    mockedGetSessionFromStorage.mockImplementationOnce((webId: string, IStorage: Storage) => undefined)

    const session = await manager.getOidcSession(webId);
    expect(session).toBeTruthy();
    expect(session.info.isLoggedIn).toEqual(false);
    expect(session.info.sessionId).toEqual(webId);

    // mapping between webId and agentUrl should be set
    const agentUrl = await storage.get(getWebIdKey(webId))
    expect(agentUrl).toBeTruthy();
    expect(await storage.get(getAgentUrlKey(agentUrl!))).toEqual(webId);
  })

});

describe('getAgentUrlForSession', () => {
  test('should agentUrl based on mapping', async () => {
    const webId = 'https://user.example/'
    const oidcSession = {
      info: { sessionId: webId },
      fetch: () => {}
    } as unknown as Session
    expect(manager.getAgentUrlForSession(oidcSession)).rejects.toThrow(`agentUrl not found for: ${webId}`)
  });

  test('should throw if agentUrl not found', async () => {
    const webId = 'https://user.example/'
    const clientId = 'https://aa.example/'
    const oidcSession = {
      info: { sessionId: webId },
      fetch: () => {}
    } as unknown as Session

    // set expected mapping in storage
    storage.set(getWebIdKey(webId), clientId)

    expect(await manager.getAgentUrlForSession(oidcSession)).toBe(clientId)
  });
});
