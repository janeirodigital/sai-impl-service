import { jest } from '@jest/globals';
import request from 'supertest'
jest.mock('../src/redis-storage')

import { redirectUrl } from '../src/auth';

import server from '../src/server'

describe('unauthenticated request', () => {
  const uuid = '75340942-4225-42e0-b897-5f36278166de'

  test('should contain valid Client ID Document', async () => {
    const res = await request(server).get(`/agents/${uuid}`)
    expect(res.body.client_id).toContain(uuid)
    expect(res.body.redirect_uris).toContain(redirectUrl)
    expect(res.body.grant_types).toEqual(
      expect.arrayContaining(['authorization_code', 'refresh_token'])
    )
  })
})

describe('authenticated request', () => {

  test.todo('application registration discovery')

  test.todo('social agent registration discovery')
})
