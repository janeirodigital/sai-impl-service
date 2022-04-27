import { AgentsHandler, HttpSolidContext, SessionManager } from "../../src";
import { jest } from '@jest/globals';

import 'dotenv/config';

import { createSolidTokenVerifier, SolidAccessTokenPayload, SolidTokenVerifierFunction } from '@solid/access-token-verifier';
jest.mock('@solid/access-token-verifier', () => {
  return {
    createSolidTokenVerifier: jest.fn()
  }
})
jest.mock('../../src/sai-session-storage', () => {
  const originalModule = jest.requireActual('../../src/sai-session-storage') as object;

  return {
    ...originalModule,
    SessionManager: jest.fn(() => {
      return {
        getFromUuid: jest.fn()
      }
    })
  }
})

const mockedCreateSolidTokenVerifier = jest.mocked(createSolidTokenVerifier)

import { redirectUrl } from '../../src';
import { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import { INTEROP } from '@janeirodigital/interop-namespaces';
import { InMemoryStorage } from "@inrupt/solid-client-authn-node";
import { HttpHandlerRequest } from "@digita-ai/handlersjs-http";

const uuid = '75340942-4225-42e0-b897-5f36278166de';

const manager = jest.mocked(new SessionManager(new InMemoryStorage()))
let agentsHandler: AgentsHandler


beforeEach(() => {
  manager.getFromUuid.mockReset();
  mockedCreateSolidTokenVerifier.mockReset()
  agentsHandler = new AgentsHandler(manager)
})

describe('unauthenticated request', () => {
  test('should contain valid Client ID Document', (done) => {
    const request = {
      headers: {},
      parameters: { uuid }
    } as unknown as HttpHandlerRequest
    const ctx = { request } as HttpSolidContext;

    agentsHandler.handle(ctx).subscribe(response => {
      expect(response.body.client_id).toContain(uuid);
      expect(response.body.redirect_uris).toContain(redirectUrl);
      expect(response.body.grant_types).toEqual(expect.arrayContaining(['authorization_code', 'refresh_token']));
      done()
    })
  });
});

test('should respond 401 when authorization is undefined and dpop is present', (done) => {
  const request = {
    url: `/agents/${uuid}`,
    method: 'GET',
    headers: {
      DPoP: 'some-proof'
    },
    parameters: { uuid }
  } as unknown as HttpHandlerRequest
  const ctx = { request } as HttpSolidContext;

  agentsHandler.handle(ctx).subscribe(response => {
    expect(response.status).toBe(400)
    done()
  })
});

test('should respond 401 when dpop is undefined and authorization is present', (done) => {
  const request = {
    url: `/agents/${uuid}`,
    method: 'GET',
    headers: {
      DPoP: 'some-proof'
    },
    parameters: { uuid }
  } as unknown as HttpHandlerRequest
  const ctx = { request } as HttpSolidContext;

  agentsHandler.handle(ctx).subscribe(response => {
    expect(response.status).toBe(400)
    done()
  })
});

describe('authenticated request', () => {
  const authorization = 'DPoP some-token'
  const dpopProof = 'some-proof'
  const webId = 'https://user.example/'
  const clientId = 'https://client.example/'

  test('application registration discovery', (done) => {
    const applicationRegistrationIri = 'https://some.example/application-registration'

    mockedCreateSolidTokenVerifier.mockImplementation(() => {
      return async function verifier (authorizationHeader, dpop) {
        expect(authorizationHeader).toBe(authorization)
        expect(dpop).toEqual({
          header: dpopProof,
          method: 'GET',
          url: `${process.env.BASE_URL}/agents/${uuid}`
        })
        return { webid: webId, client_id: clientId } as SolidAccessTokenPayload
      } as SolidTokenVerifierFunction
    })

    manager.getFromUuid.mockImplementation(async (id) => {
      expect(id).toBe(uuid)
      return {
        webId,
        findApplicationRegistration: async (applicationId) => {
          expect(applicationId).toBe(clientId)
          return { iri: applicationRegistrationIri}
        }
      } as AuthorizationAgent
    })

    const request = {
      url: `/agents/${uuid}`,
      method: 'GET',
      // TODO: check if handler makes headers lowercased
      headers: {
        Authorization: authorization,
        DPoP: dpopProof
      },
      parameters: { uuid }
    } as unknown as HttpHandlerRequest
    const ctx = { request } as HttpSolidContext;

    agentsHandler.handle(ctx).subscribe(response => {
      expect(response.headers.Link).toBe(`<${clientId}>; anchor="${applicationRegistrationIri}"; rel="${INTEROP.registeredAgent.value}"`)
      done()
    })
  });

  test('social agent registration discovery', (done) => {
    const differentWebId = 'https://different-user.example/'
    const socialAgentRegistrationIri = 'https://some.example/application-registration'

    mockedCreateSolidTokenVerifier.mockImplementation(() => {
      return async function verifier (authorizationHeader, dpop) {
        expect(authorizationHeader).toBe(authorization)
        expect(dpop).toEqual({
          header: dpopProof,
          method: 'GET',
          url: `${process.env.BASE_URL}/agents/${uuid}`
        })
        return { webid: differentWebId, client_id: clientId } as SolidAccessTokenPayload
      } as SolidTokenVerifierFunction
    })

    manager.getFromUuid.mockImplementation(async (id) => {
      expect(id).toBe(uuid)
      return {
        webId,
        findSocialAgentRegistration: async (webid) => {
          expect(webid).toBe(differentWebId)
          return { iri: socialAgentRegistrationIri}
        }
      } as AuthorizationAgent
    })

    const request = {
      url: `/agents/${uuid}`,
      method: 'GET',
      // TODO: check if handler makes headers lowercased
      headers: {
        Authorization: authorization,
        DPoP: dpopProof
      },
      parameters: { uuid }
    } as unknown as HttpHandlerRequest
    const ctx = { request } as HttpSolidContext;

    agentsHandler.handle(ctx).subscribe(response => {
      expect(response.headers.Link).toBe(`<${clientId}>; anchor="${socialAgentRegistrationIri}"; rel="${INTEROP.registeredAgent.value}"`)
      done()
    })
  });

  test('should respond 401 when applicationId from token is undefined', (done) => {
    mockedCreateSolidTokenVerifier.mockImplementation(() => {
      return async function verifier (authorizationHeader, dpop) {
        return { webid: webId } as SolidAccessTokenPayload
      } as SolidTokenVerifierFunction
    })
    const request = {
      url: `/agents/${uuid}`,
      method: 'GET',
      // TODO: check if handler makes headers lowercased
      headers: {
        Authorization: authorization,
        DPoP: dpopProof
      },
      parameters: { uuid }
    } as unknown as HttpHandlerRequest
    const ctx = { request } as HttpSolidContext;
    agentsHandler.handle(ctx).subscribe(response => {
      expect(response.status).toBe(401)
      done()
    })
  });

  test('should respond 401 when verification of DPoP-bound access token fails', (done) => {
    const socialAgentRegistrationIri = 'https://some.example/application-registration'
    mockedCreateSolidTokenVerifier.mockImplementation(() => {
      return async function verifier() {
        throw new Error('boom')
      }
    })

    const request = {
      url: `/agents/${uuid}`,
      method: 'GET',
      // TODO: check if handler makes headers lowercased
      headers: {
        Authorization: authorization,
        DPoP: dpopProof
      },
      parameters: { uuid }
    } as unknown as HttpHandlerRequest
    const ctx = { request } as HttpSolidContext;

    agentsHandler.handle(ctx).subscribe(response => {
      expect(response.status).toBe(401)
      done()
    })
  });
});
