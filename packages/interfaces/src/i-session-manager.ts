import { IStorage, Session } from "@inrupt/solid-client-authn-node"
import { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent"

export interface ISessionManager {
  storage: IStorage;
  getSaiSession(webId: string): Promise<AuthorizationAgent | undefined>;
  getOidcSession(webId: string): Promise<Session>;
  getFromAgentUrl(agentUrl: string): Promise<AuthorizationAgent | undefined>;
  getWebId(agentUrl: string): Promise<string | undefined>;
  setAgentUrl2WebIdMapping(agentUrl: string, webId: string): Promise<void>;
}
