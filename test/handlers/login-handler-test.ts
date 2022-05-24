import { jest } from "@jest/globals";
import { Mock } from "jest-mock";
import { InMemoryStorage, Session } from "@inrupt/solid-client-authn-node";
import { HttpHandlerRequest } from "@digita-ai/handlersjs-http";
import { agentRedirectUrl, agentUuid, AuthnContext, LoginHandler } from "../../src";

import { SessionManager } from "../../src/session-manager";

jest.mock('../../src/session-manager', () => {
  return {
    SessionManager: jest.fn(() => {
      return {
        getOidcSession: jest.fn(),
        setAgentUrl2WebIdMapping: jest.fn()
      }
    })
  }
})

jest.mock("@inrupt/solid-client-authn-node");
const MockedSession = Session as jest.MockedFunction<any>;

const idp = 'https://op.example'
let loginHandler: LoginHandler
const manager = jest.mocked(new SessionManager(new InMemoryStorage()))

beforeEach(() => {
  loginHandler = new LoginHandler(manager)
})

describe('unauthenticated request', () => {
  test('should respond with 401', (done) => {
    const request = {
      headers: {}
    } as unknown as HttpHandlerRequest
    const ctx = { request } as AuthnContext;

    loginHandler.handle(ctx).subscribe(response => {
      expect(response.status).toBe(401)
      done()
    })
  });
});

describe('authenticated request', () => {
  const aliceWebId = 'https://alice.example'
  const authn = {
    webId: aliceWebId,
    clientId: 'https://projectron.example'
  }
  const opRedirectUrl = 'https:/op.example/auth/?something'
  const agentUrl = 'https://sai.example/agents/123'

  let loginMock: Mock<Promise<void>>
  beforeEach(() => {
    manager.getOidcSession.mockReset();
    manager.setAgentUrl2WebIdMapping.mockReset();
    MockedSession.mockReset();
    loginMock = jest.fn(async (loginOptions: any) => {
      loginOptions.handleRedirect(opRedirectUrl);
    });
    loginHandler = new LoginHandler(manager)
  })

  test('should respond with 400 if not idp provided', (done) => {
    const request = {
      headers: {},
    } as unknown as HttpHandlerRequest
    const ctx = { request, authn } as AuthnContext;

    loginHandler.handle(ctx).subscribe(response => {
      expect(response.status).toBe(400)
      done()
    })
  });

  test('should reuse existing agent if exists for the webId', (done) => {
    const request = {
      headers: {},
      body: { idp }
    } as unknown as HttpHandlerRequest
    const ctx = { request, authn } as AuthnContext;
    manager.getOidcSession.mockImplementationOnce(async (webId) => {
      expect(webId).toBe(aliceWebId)
      return {
        info: {
          webId: aliceWebId,
          clientAppId: agentUrl
        },
        login: loginMock
      } as unknown as Session
    })
    loginHandler.handle(ctx).subscribe(response => {
      expect(response.status).toBe(200)
      expect(response.body?.redirectUrl).toBe(opRedirectUrl)
      expect(manager.getOidcSession).toBeCalledTimes(1)
      expect(loginMock).toHaveBeenCalledWith(
        expect.objectContaining({
          oidcIssuer: idp,
          clientId: agentUrl,
          redirectUrl: agentRedirectUrl(agentUrl)
        })
      )
      done()
    })
  })

  test('should create new agent if none exists for the webId', (done) => {
    const request = {
      headers: {},
      body: { idp }
    } as unknown as HttpHandlerRequest
    const ctx = { request, authn } as AuthnContext;
    MockedSession.mockImplementationOnce((sessionOptions: any, sessionId: string) => {
      expect(sessionId).toBe(aliceWebId)
      return {
        info: { sessionId: aliceWebId},
        login: loginMock
      };
    });
    manager.setAgentUrl2WebIdMapping.mockImplementationOnce(async (agentUrl, webId) => {
      expect(agentUuid(agentUrl)).toBeTruthy()
      expect(webId).toBe(aliceWebId)
    })
    loginHandler.handle(ctx).subscribe(response => {
      expect(response.status).toBe(200)
      expect(response.body?.redirectUrl).toBe(opRedirectUrl)
      expect(MockedSession).toBeCalledTimes(1)
      expect(manager.setAgentUrl2WebIdMapping).toBeCalledTimes(1)
      expect(loginMock).toHaveBeenCalledWith(
        expect.objectContaining({
          oidcIssuer: idp,
          clientId: expect.stringMatching(/agents\/.*$/),
          redirectUrl: expect.stringMatching(/agents\/.*\/redirect$/)
        })
      )
      done()
    })
  })
});
