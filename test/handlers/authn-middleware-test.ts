import { jest } from '@jest/globals';
import { AuthnMiddleware, HttpSolidContext, baseUrl } from "../../src";

import { createSolidTokenVerifier, SolidAccessTokenPayload, SolidTokenVerifierFunction } from '@solid/access-token-verifier';
jest.mock('@solid/access-token-verifier', () => {
  return {
    createSolidTokenVerifier: jest.fn()
  }
})

const mockedCreateSolidTokenVerifier = jest.mocked(createSolidTokenVerifier)

import { HttpHandlerRequest, HttpHandlerResponse } from "@digita-ai/handlersjs-http";

const url = '/some/';

let authnMiddleware: AuthnMiddleware


beforeEach(() => {
  authnMiddleware = new AuthnMiddleware()
  mockedCreateSolidTokenVerifier.mockReset()
})

describe('unauthenticated request', () => {
  test('should not set authn on the context', (done) => {
    const request = {
      headers: {}
    } as unknown as HttpHandlerRequest
    const ctx = { request } as HttpSolidContext;

    authnMiddleware.handle(ctx).subscribe(nextContext => {
      expect(nextContext.authn).toBeUndefined()
      done()
    })
  });
});

test('should respond 401 when authorization is undefined and dpop is present', (done) => {
  const request = {
    url,
    method: 'GET',
    headers: {
      DPoP: 'some-proof'
    }
  } as unknown as HttpHandlerRequest
  const ctx = { request } as HttpSolidContext;

  authnMiddleware.handle(ctx).subscribe({
    error: (response: HttpHandlerResponse) => {
      expect(response.status).toBe(400)
      done()
    }
  })
});

test('should respond 401 when dpop is undefined and authorization is present', (done) => {
  const request = {
    url,
    method: 'GET',
    headers: {
      Authorization: 'DPoP some-token'
    }
  } as unknown as HttpHandlerRequest
  const ctx = { request } as HttpSolidContext;

  authnMiddleware.handle(ctx).subscribe({
    error: (response: HttpHandlerResponse) => {
      expect(response.status).toBe(400)
      done()
    }
  })
});

describe('authenticated request', () => {
  const authorization = 'DPoP some-token'
  const dpopProof = 'some-proof'
  const webId = 'https://user.example/'
  const clientId = 'https://client.example/'

  test('should set proper authn on the context', (done) => {
    const applicationRegistrationIri = 'https://some.example/application-registration'

    mockedCreateSolidTokenVerifier.mockImplementation(() => {
      return async function verifier (authorizationHeader, dpop) {
        expect(authorizationHeader).toBe(authorization)
        expect(dpop).toEqual({
          header: dpopProof,
          method: 'GET',
          url: `${baseUrl}${url}`
        })
        return { webid: webId, client_id: clientId } as SolidAccessTokenPayload
      } as SolidTokenVerifierFunction
    })
    const request = {
      url,
      method: 'GET',
      // TODO: check if handler makes headers lowercased
      headers: {
        Authorization: authorization,
        DPoP: dpopProof
      }
    } as unknown as HttpHandlerRequest
    const ctx = { request } as HttpSolidContext;

    authnMiddleware.handle(ctx).subscribe(nextContext => {
      expect(nextContext.authn!.webId).toBe(webId)
      expect(nextContext.authn!.clientId).toBe(clientId)
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
      url,
      method: 'GET',
      // TODO: check if handler makes headers lowercased
      headers: {
        Authorization: authorization,
        DPoP: dpopProof
      }
    } as unknown as HttpHandlerRequest
    const ctx = { request } as HttpSolidContext;

    authnMiddleware.handle(ctx).subscribe({
      error: response => {
        expect(response.status).toBe(401)
        done()
      }
    })
  });
});
