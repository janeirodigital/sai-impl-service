import { jest } from "@jest/globals"
import { IStorage, Session } from "@inrupt/solid-client-authn-node"
import { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent"
import { ISessionManager } from "@janeirodigital/sai-server-interfaces"

export class MockedSessionManager implements ISessionManager {
  constructor(public storage: IStorage) {}
  getSaiSession = jest.fn(async(webId: string): Promise<AuthorizationAgent> => { return undefined as unknown as AuthorizationAgent })
  getOidcSession = jest.fn (async(webId: string): Promise<Session> => { return undefined as unknown as Session })
}
