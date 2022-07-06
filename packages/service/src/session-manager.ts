import { randomUUID } from "crypto";
import { getSessionFromStorage, IStorage, Session } from "@inrupt/solid-client-authn-node";
import { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent";
import { ISessionManager } from "@janeirodigital/sai-server-interfaces"

import { uuid2agentUrl } from "./url-templates";

type WebId = string;

const cache = new Map<WebId, AuthorizationAgent>();

export function getAgentUrlKey(clientId: string): string {
  return `agentUrl:${clientId}`;
}

export function getWebIdKey(webId: string): string {
  return `webId:${webId}`;
}

async function buildSaiSession(
  oidcSession: Session,
  clientId: string
): Promise<AuthorizationAgent> {
  // TODO handle if (!oidcSession.info.isLoggedIn)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const webId = oidcSession.info.webId!;
  return AuthorizationAgent.build(webId, clientId, {
    fetch: oidcSession.fetch,
    randomUUID,
  });
}

export class SessionManager implements ISessionManager {
  constructor(public storage: IStorage) {}

  async getSaiSession(webId: string): Promise<AuthorizationAgent | undefined> {
    const cached = cache.get(webId);
    if (cached) return cached;
    const oidcSession = await this.getOidcSession(webId)
    if (oidcSession) {
      const agentUrl = await this.getAgentUrlForSession(oidcSession)
      const saiSession = await buildSaiSession(oidcSession, agentUrl);
      cache.set(webId, saiSession);
      return saiSession;
    }
  }

  private async buildOidcSession(webId: string): Promise<Session> {
      const agentUrl = uuid2agentUrl(randomUUID());

      // set bi-directional mapping between webId and agentUrl
      await this.storage.set(getAgentUrlKey(agentUrl), webId)
      await this.storage.set(getWebIdKey(webId), agentUrl)

      return new Session({ storage: this.storage }, webId);

  }

  async getOidcSession(webId: string): Promise<Session> {
    let session = await getSessionFromStorage(webId, this.storage);

    if (!session) {
      session = await this.buildOidcSession(webId)
    }

    return session;
  }

  async getFromAgentUrl(agentUrl: string): Promise<AuthorizationAgent | undefined> {
    const webId = await this.getWebId(agentUrl);
    return webId ? this.getSaiSession(webId) : undefined;
  }

  async getWebId(agentUrl: string): Promise<string | undefined> {
    return this.storage.get(getAgentUrlKey(agentUrl));
  }

  // assumes that oidcSession was created using buildOidcSession
  // and mapping was set
  async getAgentUrlForSession(oidcSession: Session): Promise<string> {
    // we use WebID as sessionId and it is available even before logging in
    const webId = oidcSession.info.sessionId
    const agentUrl = await this.storage.get(getWebIdKey(webId));
    // this should only happen if storage is corrupted
    if (!agentUrl) throw new Error(`agentUrl not found for: ${webId}`)
    return agentUrl
  }
}
