import { jest } from '@jest/globals';
import { createTestServer } from "./components-builder";
import { lastValueFrom } from 'rxjs'
import { Server } from '@digita-ai/handlersjs-http';

import { createSolidTokenVerifier, SolidAccessTokenPayload, SolidTokenVerifierFunction } from '@solid/access-token-verifier';
jest.mock('@solid/access-token-verifier', () => {
  return {
    createSolidTokenVerifier: jest.fn()
  }
})

const mockedCreateSolidTokenVerifier = jest.mocked(createSolidTokenVerifier)

let server: Server

// TODO: may require random port to run on CI
const baseUrl = 'http://0.0.0.0:4000'

beforeAll(async () => {
  server = await createTestServer()
  await lastValueFrom(server.start())
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
  const webId = 'https://alice.example/'
  const clientId = 'https://projectron.example/'
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

  test('should respond 400 if json content type but idp not specified ', async () => {
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
})
