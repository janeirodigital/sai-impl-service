import { jest } from '@jest/globals';
import request from 'supertest';

import 'dotenv/config';

import { createSolidTokenVerifier, SolidAccessTokenPayload, SolidTokenVerifierFunction } from '@solid/access-token-verifier';
jest.mock('@solid/access-token-verifier', () => {
  return {
    createSolidTokenVerifier: jest.fn()
  }
})
import { storage } from "../src/sai-session-storage";
jest.mock('../src/sai-session-storage', () => {
  const originalModule = jest.requireActual('../src/sai-session-storage') as object;

  return {
    ...originalModule,
    storage: {
      getFromUuid: jest.fn()
    }
  }
})
const mockedStorage = jest.mocked(storage, true)

const mockedCreateSolidTokenVerifier = jest.mocked(createSolidTokenVerifier)
jest.mock('../src/redis-storage');

import { redirectUrl } from '../src/auth';
import server from '../src/server';
import { AuthorizationAgent } from '@janeirodigital/interop-authorization-agent';
import { INTEROP } from '@janeirodigital/interop-namespaces';

const uuid = '75340942-4225-42e0-b897-5f36278166de';

beforeEach(() => {
  mockedStorage.getFromUuid.mockReset();
  mockedCreateSolidTokenVerifier.mockReset()
})

describe('unauthenticated request', () => {
  test('should contain valid Client ID Document', async () => {
    mockedStorage
    const res = await request(server).get(`/agents/${uuid}`);
    expect(res.body.client_id).toContain(uuid);
    expect(res.body.redirect_uris).toContain(redirectUrl);
    expect(res.body.grant_types).toEqual(expect.arrayContaining(['authorization_code', 'refresh_token']));
  });
});

describe('authenticated request', () => {
  const authorization = 'DPoP some-token'
  const dpopProof = 'some-proof'
  const webId = 'https://user.example/'
  const clientId = 'https://client.example/'

  test('application registration discovery', async() => {
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

    mockedStorage.getFromUuid.mockImplementation(async (id) => {
      expect(id).toBe(uuid)
      return {
        webId,
        findApplicationRegistration: async (applicationId) => {
          expect(applicationId).toBe(clientId)
          return { iri: applicationRegistrationIri}
        }
      } as AuthorizationAgent
    })

    const res = await request(server)
      .get(`/agents/${uuid}`)
      .set({ Authorization: authorization, DPoP: dpopProof})

    expect(res.headers.link).toBe(`<${clientId}>; anchor="${applicationRegistrationIri}"; rel="${INTEROP.registeredAgent.value}"`)
  });

  test('social agent registration discovery', async() => {
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

    mockedStorage.getFromUuid.mockImplementation(async (id) => {
      expect(id).toBe(uuid)
      return {
        webId,
        findSocialAgentRegistration: async (webid) => {
          expect(webid).toBe(differentWebId)
          return { iri: socialAgentRegistrationIri}
        }
      } as AuthorizationAgent
    })

    const res = await request(server)
      .get(`/agents/${uuid}`)
      .set({ Authorization: authorization, DPoP: dpopProof})

    expect(res.headers.link).toBe(`<${clientId}>; anchor="${socialAgentRegistrationIri}"; rel="${INTEROP.registeredAgent.value}"`)
  });

  test('should respond 401 when applicationId from token is undefined', async() => {
    mockedCreateSolidTokenVerifier.mockImplementation(() => {
      return async function verifier (authorizationHeader, dpop) {
        return { webid: webId } as SolidAccessTokenPayload
      } as SolidTokenVerifierFunction
    })
    const res = await request(server)
      .get(`/agents/${uuid}`)
      .set({ Authorization: authorization, DPoP: dpopProof})
    expect(res.statusCode).toBe(401)
  });


  test('should respond 401 when verification of DPoP-bound access token fails', async() => {
    const socialAgentRegistrationIri = 'https://some.example/application-registration'
    mockedCreateSolidTokenVerifier.mockImplementation(() => {
      return async function verifier() {
        throw new Error('boom')
      }
    })
    const res = await request(server)
      .get(`/agents/${uuid}`)
      .set({ Authorization: authorization, DPoP: dpopProof})

    expect(res.statusCode).toBe(401)
  });
});
