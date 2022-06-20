import { jest } from '@jest/globals';
import { AuthnContextHandler } from "../../../src";

import { createSolidTokenVerifier, SolidAccessTokenPayload } from '@solid/access-token-verifier';

jest.mock('@solid/access-token-verifier', () => {
  return {
    createSolidTokenVerifier: jest.fn()
  }
})

const mockedCreateSolidTokenVerifier = jest.mocked(createSolidTokenVerifier)

import {
  BadRequestHttpError, HttpError,
  HttpHandlerContext,
  HttpHandlerRequest, UnauthorizedHttpError
} from "@digita-ai/handlersjs-http";

const url = '/some/';

let authnContextHandler: AuthnContextHandler


beforeEach(() => {
  authnContextHandler = new AuthnContextHandler()
  mockedCreateSolidTokenVerifier.mockReset()
})

describe('Unauthenticated request', () => {
  test('should throw with BadRequest if no authentication is provided', (done) => {
    const request = {
      headers: {}
    } as unknown as HttpHandlerRequest
    const ctx = { request } as HttpHandlerContext;

    authnContextHandler.handle(ctx).subscribe(
      {
        error(e: HttpError) {
          expect(e).toBeInstanceOf(UnauthorizedHttpError);
          done();
      }
    })
  });

  test('should throw with BadRequest if only DPoP headers are provided', (done) => {
    const request = {
      url,
      method: 'GET',
      headers: {
        dpop: 'some-proof'
      }
    } as unknown as HttpHandlerRequest
    const ctx = { request } as HttpHandlerContext;

    authnContextHandler.handle(ctx).subscribe({
      error: (e: HttpError) => {
        expect(e).toBeInstanceOf(BadRequestHttpError);
        done();
      }
    })
  });

  test('should throw with BadRequest when `DPoP` is not present and `authorization` is present', (done) => {
    const request = {
      url,
      method: 'GET',
      headers: {
        authorization: 'DPoP some-token'
      }
    } as unknown as HttpHandlerRequest
    const ctx = { request } as HttpHandlerContext;

    authnContextHandler.handle(ctx).subscribe({
      error: (e: HttpError) => {
        expect(e).toBeInstanceOf(BadRequestHttpError);
        done()
      }
    })
  });

  test('should throw with UnauthorizedRequest when verification of DPoP-bound access token fails', (done) => {
    const authorization = 'DPoP some-token'
    const dpopProof = 'some-proof'

    mockedCreateSolidTokenVerifier.mockImplementation(() => {
      return async function verifier() {
        return Promise.reject(new Error());
      }
    })

    const request = {
      url,
      method: 'GET',
      // TODO: check if handler makes headers lowercase
      headers: {
        authorization,
        dpop: dpopProof
      }
    } as unknown as HttpHandlerRequest
    const ctx = { request } as HttpHandlerContext;

    authnContextHandler.handle(ctx).subscribe({
      error(e: HttpError) {
        expect(e).toBeInstanceOf(UnauthorizedHttpError);
        done()
      }
    })
  });
});

describe('Authenticated request', () => {
  const authorization = 'DPoP some-token'
  const dpopProof = 'some-proof'
  const webId = 'https://user.example/'
  const clientId = 'https://client.example/'

  test('should set proper authn on the context', (done) => {
    mockedCreateSolidTokenVerifier.mockImplementation(() => {
      const response = {webid: webId, client_id: clientId} as SolidAccessTokenPayload;
      return async function verifier () {
        return Promise.resolve(response);
      };
    })

    const request = {
      url,
      method: 'GET',
      // TODO: check if handler makes headers lowercase
      headers: {
        authorization,
        dpop: dpopProof
      }
    } as unknown as HttpHandlerRequest
    const ctx = { request } as HttpHandlerContext;

    authnContextHandler.handle(ctx).subscribe(nextContext => {
      expect(mockedCreateSolidTokenVerifier.mock.calls.length).toEqual(1);
      expect(nextContext.authn.webId).toBe(webId)
      expect(nextContext.authn.clientId).toBe(clientId)
      done()
    })
  });

});
