import { IStorage, Session } from "@inrupt/solid-client-authn-node"
import { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent"

export interface ISessionManager {
  storage: IStorage; // TODO can be removed after checking if component builder still works
  getSaiSession(webId: string): Promise<AuthorizationAgent>;
  getOidcSession(webId: string): Promise<Session>;
  // TODO: move to separate service or rename this interface to something more generic
  getPushSubscriptions(webId: string): Promise<PushSubscription[]>;
  addPushSubscription(webId: string, subscription: PushSubscription): Promise<void>;
}
