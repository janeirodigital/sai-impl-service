import { jest } from '@jest/globals';
import request from 'supertest'

import "dotenv/config";
jest.mock('../src/redis-storage')

import { Session } from '@inrupt/solid-client-authn-node'
jest.mock('@inrupt/solid-client-authn-node')

const MockedSession = Session as jest.MockedFunction<any>

const loginMock = jest.fn((loginOptions: any) => {
    loginOptions.handleRedirect('some.iri')
  }
)
MockedSession.mockImplementation(() => {
  return {
    info: { sessionId: 'some-session-id'},
    login: loginMock
  }
})

import server from '../src/server'

describe('POST /login', () => {

  test('gives clientId to solid-oidc client', async () => {
    await request(server)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send({ idp: 'https://localhost:3000'})

    expect(loginMock).toBeCalledTimes(1)
    expect(loginMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: expect.stringContaining(`${process.env.BASE_URL}/agents/`)
      })
    )
  })
})
