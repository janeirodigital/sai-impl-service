import { jest } from '@jest/globals';
import { ComponentsManager } from 'componentsjs';
import { createTestServer } from "./components-builder";
import { lastValueFrom } from 'rxjs'
import { Server } from '@digita-ai/handlersjs-http';
import { baseUrl, agentRedirectUrl, uuid2agentUrl } from '../../src/url-templates'
import { MockedSessionManager } from '../../src/mocked-session-manager'

import { createSolidTokenVerifier, SolidAccessTokenPayload, SolidTokenVerifierFunction } from '@solid/access-token-verifier';
jest.mock('@solid/access-token-verifier', () => {
  return {
    createSolidTokenVerifier: jest.fn()
  }
})
const mockedCreateSolidTokenVerifier = jest.mocked(createSolidTokenVerifier)

import { Session, getSessionFromStorage } from "@inrupt/solid-client-authn-node";
jest.mock('@inrupt/solid-client-authn-node', () => {
  const originalModule = jest.requireActual('@inrupt/solid-client-authn-node') as object;

  return {
    ...originalModule,
    Session: jest.fn(),
    getSessionFromStorage: jest.fn()
  }
})
const MockedSession = Session as jest.MockedFunction<any>;
const mockedGetSessionFromStorage = getSessionFromStorage as jest.MockedFunction<any>;


let server: Server
let componentsManager: ComponentsManager<Server>
let manager: MockedSessionManager

const webId = 'https://alice.example'

beforeAll(async () => {
  const created = await createTestServer()
  server = created.server
  componentsManager = created.componentsManager
  await lastValueFrom(server.start())
  const instanceRegistry = await componentsManager.configConstructorPool.getInstanceRegistry()
  manager = await instanceRegistry["urn:ssv:SessionManager"] as unknown as MockedSessionManager
})

afterAll(async () => {
  await lastValueFrom(server.stop())
})

beforeEach(async () => {
  mockedCreateSolidTokenVerifier.mockReset()
})

test('should respond 401 for unauthenticated request', async () => {
  const response = await fetch(`${baseUrl}/login`, {
    method: 'POST'
  })
  expect(response.ok).toBeFalsy()
  expect(response.status).toBe(401)
})

describe('authenticated request', () => {

  const dpopProof = 'dpop-proof'
  const authorization = 'DPoP some-token'
  const path = '/login'
  const url = `${baseUrl}${path}`
  const clientId = 'https://projectron.example'
  beforeEach(() => {
    mockedCreateSolidTokenVerifier.mockImplementation(() => {
      return async function verifier (authorizationHeader, dpop) {
        expect(authorizationHeader).toBe(authorization)
        expect(dpop).toEqual({
          header: dpopProof,
          method: 'POST',
          url
        })
        return { webid: webId, client_id: clientId } as SolidAccessTokenPayload
      } as SolidTokenVerifierFunction
    })
  })

  test('should respond 400 if not json content type', async () => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'DPoP': dpopProof,
        'Authorization': authorization,
      }
    })
    expect(response.ok).toBeFalsy()
    expect(response.status).toBe(400)
  })

  test('should respond 400 if json content type but idp not specified', async () => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'DPoP': dpopProof,
        'Authorization': authorization,
        'Content-Type': 'application/json'
      }
    })
    expect(response.ok).toBeFalsy()
    expect(response.status).toBe(400)
  })

  test('should respond with url for redirecting', async () => {
    const idp = 'https://op.example'
    const opRedirectUrl = 'https:/op.example/auth/?something'
    const loginMock = jest.fn(async (loginOptions: any) => {
      loginOptions.handleRedirect(opRedirectUrl);
    });
    MockedSession.mockImplementationOnce((sessionOptions: any, sessionId: string) => {
      expect(sessionId).toBe(webId)
      return {
        info: { sessionId: webId},
        login: loginMock
      };
    });
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'DPoP': dpopProof,
        'Authorization': authorization,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ idp })
    })
    expect(response.ok).toBeTruthy()
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.redirectUrl).toBe(opRedirectUrl)
    expect(loginMock).toHaveBeenCalledWith(
      expect.objectContaining({
        oidcIssuer: idp,
      })
    )
  })
})

describe('login-redirect', () => {
  const agentUuid = '8cfa17ac-19b9-42bc-8df4-aad3ddf64bf5'
  const agentUrl = uuid2agentUrl(agentUuid)
  const url = agentRedirectUrl(agentUrl)

  beforeEach(() => {
    manager.getWebId.mockReset()
    mockedGetSessionFromStorage.mockReset()
  })

  test('responds 404 if no user associated with given agent', async () => {
    manager.getWebId.mockImplementationOnce(async (url) => {
      expect(url).toBe(agentUrl)
      return undefined
    })
    const response = await fetch(url)
    expect(manager.getWebId).toBeCalledTimes(1)
    expect(response.ok).toBeFalsy()
    expect(response.status).toBe(404)
  })

  test('responds 500 if oidc session does not exist for the user of this agent', async () => {
    manager.getWebId.mockImplementationOnce(async (url) => {
      expect(url).toBe(agentUrl)
      return webId
    })
    mockedGetSessionFromStorage.mockImplementationOnce((sessionId: string) => {
      expect(sessionId).toBe(webId)
    })
    const response = await fetch(url)
    expect(manager.getWebId).toBeCalledTimes(1)
    expect(mockedGetSessionFromStorage).toBeCalledTimes(1)
    expect(response.ok).toBeFalsy()
    expect(response.status).toBe(500)
  })
})
