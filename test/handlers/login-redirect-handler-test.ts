import { jest } from '@jest/globals';
import { InMemoryStorage, IStorage } from '@inrupt/solid-client-authn-node';
import { HttpHandlerRequest } from '@digita-ai/handlersjs-http';
import { OidcContext, LoginRedirectHandler, frontendUrl } from '../../src';

import { SessionManager } from '../../src/session-manager'
jest.mock('../../src/session-manager', () => {
  return {
    SessionManager: jest.fn(() => {
      return {
        getOidcSession: jest.fn(),
        setAgentUrl2WebIdMapping: jest.fn(),
        getWebId: jest.fn()
      }
    })
  }
})

let loginRedirectHandler: LoginRedirectHandler
const manager = jest.mocked(new SessionManager(new InMemoryStorage()))

import { getSessionFromStorage } from '@inrupt/solid-client-authn-node';
import { url } from 'inspector';
jest.mock('@inrupt/solid-client-authn-node', () => {
  const originalModule = jest.requireActual('@inrupt/solid-client-authn-node') as object;

  return {
    ...originalModule,
    getSessionFromStorage: jest.fn()
  }
})
const mockedGetSessionFromStorage = getSessionFromStorage as jest.MockedFunction<any>;

const uuid = '75340942-4225-42e0-b897-5f36278166de';
const aliceWebId = 'https://alice.example'

beforeEach(() => {
  loginRedirectHandler = new LoginRedirectHandler(manager)
  mockedGetSessionFromStorage.mockReset();
  manager.getWebId.mockReset()
})

test('respond 404 if agent does not exist', (done) => {
  const request = {
    headers: {},
    parameters: { uuid }
  } as unknown as HttpHandlerRequest
  const ctx = { request } as OidcContext;

  loginRedirectHandler.handle(ctx).subscribe(response => {
    expect(response.status).toBe(404)
    done()
  })
})

test('respond 500 if session does not exist', (done) => {
  const request = {
    headers: {},
    parameters: { uuid }
  } as unknown as HttpHandlerRequest
  const ctx = { request } as OidcContext;

  manager.getWebId.mockImplementationOnce(async (agentUrl: string) => {
    return aliceWebId
  })

  mockedGetSessionFromStorage.mockImplementationOnce(async (id: string, storage: IStorage) => {
    expect(id).toBe(aliceWebId)
  })

  loginRedirectHandler.handle(ctx).subscribe(response => {
    expect(response.status).toBe(500)
    expect(manager.getWebId).toBeCalledTimes(1)
    expect(mockedGetSessionFromStorage).toBeCalledTimes(1)
    done()
  })
})

test('redirects to frontend after handing a valid redirect', (done) => {
  const request = {
    headers: {},
    parameters: { uuid },
    url: {
      pathname: '/agents/123/redirect',
      search: 'code=some-code&state=some-state'
    }
  } as unknown as HttpHandlerRequest
  const ctx = { request } as OidcContext;

  manager.getWebId.mockImplementationOnce(async (agentUrl: string) => {
    return aliceWebId
  })

  const handleIncomingRedirectMock = jest.fn(async (completeUrl) => {
    expect(completeUrl).toContain(request.url.pathname + request.url.search)
  })

  mockedGetSessionFromStorage.mockImplementationOnce(async (id: string, storage: IStorage) => {
    expect(id).toBe(aliceWebId)
    return {
      handleIncomingRedirect: handleIncomingRedirectMock,
      info: {
        isLoggedIn: true,
        webId: aliceWebId
      }
    }
  })

  loginRedirectHandler.handle(ctx).subscribe(response => {
    expect(response.status).toBe(300)
    expect(response.headers.location).toBe(frontendUrl)
    expect(manager.getWebId).toBeCalledTimes(1)
    expect(mockedGetSessionFromStorage).toBeCalledTimes(1)
    expect(handleIncomingRedirectMock).toBeCalledTimes(1)
    done()
  })

})
