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

import { SessionManager } from '../../src/session-manager';
import { webId2agentUrl } from '../../src/url-templates'

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

describe('getSaiSession', () => {
  test('creates sai session', async () => {
    const webId = 'https://user.example/'
    const oidcSession = {
      info: { webId, sessionId: webId },
      fetch: () => {}
    } as unknown as Session

    mockedGetSessionFromStorage.mockImplementationOnce((webId: string, iStorage: Storage) => {
      return oidcSession
    });
    const authAgent = {} as unknown as AuthorizationAgent
    MockedAuthorizationAgent.build.mockImplementationOnce((webid: string, agentid: string, dependencies: {fetch: Function}) => {
      expect(webid).toBe(webId)
      expect(agentid).toBe(webId2agentUrl(webId))
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
  })

});
