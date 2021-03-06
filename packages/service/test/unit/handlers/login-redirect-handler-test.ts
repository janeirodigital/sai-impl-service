import { jest } from '@jest/globals';
import { InMemoryStorage, Session } from '@inrupt/solid-client-authn-node';
import {
  HttpError,
  HttpHandlerContext,
  HttpHandlerRequest, NotFoundHttpError
} from "@digita-ai/handlersjs-http";

import { LoginRedirectHandler, frontendUrl, baseUrl } from '../../../src';

import { SessionManager } from '../../../src/session-manager'
jest.mock('../../../src/session-manager', () => {
  return {
    SessionManager: jest.fn(() => {
      return {
        getOidcSession: jest.fn(),
        getWebId: jest.fn()
      }
    })
  }
})

let loginRedirectHandler: LoginRedirectHandler
const manager = jest.mocked(new SessionManager(new InMemoryStorage()))

const uuid = '75340942-4225-42e0-b897-5f36278166de';
const aliceWebId = 'https://alice.example'

beforeEach(() => {
  loginRedirectHandler = new LoginRedirectHandler(manager)
  manager.getWebId.mockReset()
  manager.getOidcSession.mockReset()
})

test('respond 404 if agent does not exist', (done) => {
  const request = {
    headers: {},
    parameters: { uuid }
  } as unknown as HttpHandlerRequest
  const ctx = { request } as HttpHandlerContext;

  loginRedirectHandler.handle(ctx).subscribe({
    error: (e: HttpError) => {
      expect(e).toBeInstanceOf(NotFoundHttpError);
      done();
    }
  })
})

test('redirects to frontend after handing a valid redirect', (done) => {
  const pathname = '/agents/123/redirect'
  const search = 'code=some-code&state=some-state'
  const request = {
    headers: {},
    parameters: { uuid },
    url: new URL( pathname + search, baseUrl)
  } as unknown as HttpHandlerRequest
  const ctx = { request } as HttpHandlerContext;

  manager.getWebId.mockImplementationOnce(async (agentUrl: string) => {
    return aliceWebId
  })

  const handleIncomingRedirectMock = jest.fn(async (completeUrl) => {
    expect(completeUrl).toContain(request.url.pathname + request.url.search)
  })

  manager.getOidcSession.mockImplementationOnce(async (id: string) => {
    expect(id).toBe(aliceWebId)
    return {
      handleIncomingRedirect: handleIncomingRedirectMock,
      info: {
        isLoggedIn: true,
        webId: aliceWebId
      }
    } as unknown as Session
  })

  loginRedirectHandler.handle(ctx).subscribe(response => {
    expect(manager.getWebId).toBeCalledTimes(1)
    expect(manager.getOidcSession).toBeCalledTimes(1)
    expect(handleIncomingRedirectMock).toBeCalledTimes(1)
    expect(response.status).toBe(302)
    expect(response.headers.location).toBe(frontendUrl)
    done()
  })

})
