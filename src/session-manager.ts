import { randomUUID } from "crypto";
import { getSessionFromStorage, IStorage, Session } from "@inrupt/solid-client-authn-node";
import { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent";
import { ISessionManager } from "./interfaces/i-session-manager";

type WebId = string;

const cache = new Map<WebId, AuthorizationAgent>();

export function getAgentUrlKey(clientId: string): string {
  return `agentUrl:${clientId}`;
}

async function buildSaiSession(
  oidcSession: Session,
  clientId: string
): Promise<AuthorizationAgent> {
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
      const saiSession = await buildSaiSession(oidcSession, oidcSession.info.clientAppId!);
      cache.set(webId, saiSession);
      return saiSession;
    }
  }

  async getOidcSession(webId: string): Promise<Session | undefined> {
    return getSessionFromStorage(webId, this.storage);
  }

  async getFromAgentUrl(agentUrl: string): Promise<AuthorizationAgent | undefined> {
    const webId = await this.getWebId(agentUrl);
    return webId ? this.getSaiSession(webId) : undefined;
  }

  async getWebId(agentUrl: string): Promise<string | undefined> {
    return this.storage.get(getAgentUrlKey(agentUrl));
  }

  async setAgentUrl2WebIdMapping (agentUrl: string, webId: string): Promise<void> {
    await this.storage.set(getAgentUrlKey(agentUrl), webId)
  }
}
