import { jest } from '@jest/globals';
import request from 'supertest';

import 'dotenv/config';
jest.mock('../src/redis-storage');

import { storage } from "../src/sai-session-storage";
jest.mock('../src/sai-session-storage', () => {
  const originalModule = jest.requireActual('../src/sai-session-storage') as object;

  return {
    ...originalModule,
    storage: {
      changeKey: jest.fn()
    }
  }
})
const mockedStorage = jest.mocked(storage, true)

import { Session, getSessionFromStorage } from '@inrupt/solid-client-authn-node';
jest.mock('@inrupt/solid-client-authn-node');

const mockedGetSessionFromStorage = getSessionFromStorage as jest.MockedFunction<any>;

const MockedSession = Session as jest.MockedFunction<any>;
const loginMock = jest.fn((loginOptions: any) => {
  loginOptions.handleRedirect('some.iri');
});
const oidcSessionId = 'some-session-id'
MockedSession.mockImplementation(() => {
  return {
    info: { sessionId: oidcSessionId},
    login: loginMock
  };
});

import server from '../src/server';

describe('POST /login', () => {
  test('gives clientId to solid-oidc client', async () => {
    await request(server)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send({ idp: 'https://localhost:3000' });

    expect(loginMock).toBeCalledTimes(1);
    expect(loginMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: expect.stringContaining(`${process.env.BASE_URL}/agents/`)
      })
    );
  });
  test('should respond 400 when idp is not provided', async () => {
    const resp = await request(server)
    .post('/auth/login')
    expect(resp.statusCode).toBe(400)
  })
  test('should respond 400 when session is not provided', async () => {
    const resp = await request(server)
    .post('/auth/login')
    expect(resp.statusCode).toBe(400)
  })
});

describe('GET handleLoginRedirect', () => {
  test('should redirect when there is no cookie', async () => {
    const resp = await request(server)
      .get('/auth/handleLoginRedirect')

    expect(resp.statusCode).toBe(302)
    expect(resp.headers.location).toBe(process.env.BASE_URL!)
  })

  test('should redirect when valid cookie but no valid oidc session', async () => {
    const loginReq = await request(server)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send({ idp: 'https://localhost:3000' });
    let sessionCookies = loginReq.get('Set-Cookie')

    const resp = await request(server)
      .get('/auth/handleLoginRedirect')
      .set('Cookie', sessionCookies)

    expect(resp.statusCode).toBe(302)
    expect(resp.headers.location).toBe(process.env.BASE_URL!)
  })

  test('should correctly process valid request', async () => {
    const webId = 'https://alice.example/';
    const redirectUrl = `${process.env.BASE_URL}/auth/handleLoginRedirect`
    const mockHandleIncomingRedirect = jest.fn(async url => {
      expect(url).toBe(redirectUrl)
    })
    mockedGetSessionFromStorage.mockImplementation(() => {
      return {
        handleIncomingRedirect: mockHandleIncomingRedirect,
        info: {
          isLoggedIn: true,
          webId: webId
        }
      }
    })
    mockedStorage.changeKey.mockImplementationOnce(async (sid, webid) => {
      expect(sid).toBe(oidcSessionId)
      expect(webid).toBe(webId)
    })

    const loginRes = await request(server)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send({ idp: 'https://localhost:3000' });
    let loginCookies = loginRes.get('Set-Cookie')

    const resp = await request(server)
      .get('/auth/handleLoginRedirect')
      .set('Cookie', loginCookies)

    let redirectCookies = resp.get('Set-Cookie')
    expect(redirectCookies).toBeTruthy()
    expect(redirectCookies).not.toEqual(expect.arrayContaining(loginCookies))
  })
})
