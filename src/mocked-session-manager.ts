import { jest } from "@jest/globals"
import { IStorage, Session } from "@inrupt/solid-client-authn-node"
import { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent"
import { ISessionManager } from "./interfaces/i-session-manager"

export class MockedSessionManager implements ISessionManager {
  constructor(public storage: IStorage) {}
  getSaiSession = jest.fn(async(webId: string): Promise<AuthorizationAgent | undefined> => { return undefined })
  getOidcSession = jest.fn (async(webId: string): Promise<Session | undefined> => { return undefined })
  getFromAgentUrl = jest.fn (async(agentUrl: string): Promise<AuthorizationAgent | undefined> => { return undefined })
  getWebId = jest.fn (async(agentUrl: string): Promise<string | undefined> => { return undefined })
  setAgentUrl2WebIdMapping = jest.fn (async(agentUrl: string, webId: string): Promise<void> => { return undefined })
}
