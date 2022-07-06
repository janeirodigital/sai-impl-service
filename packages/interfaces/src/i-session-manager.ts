import { IStorage, Session } from "@inrupt/solid-client-authn-node"
import { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent"

export interface ISessionManager {
  storage: IStorage; // TODO can be removed after checking if component builder still works
  getSaiSession(webId: string): Promise<AuthorizationAgent | undefined>;
  getOidcSession(webId: string): Promise<Session>;
  getFromAgentUrl(agentUrl: string): Promise<AuthorizationAgent | undefined>;
  getWebId(agentUrl: string): Promise<string | undefined>;
  getAgentUrlForSession(oidcSession: Session): Promise<string>
}
