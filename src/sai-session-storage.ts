import { randomUUID } from "crypto";
import { getSessionFromStorage, IStorage, Session } from "@inrupt/solid-client-authn-node";
import { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent";

type WebId = string;

const cache = new Map<WebId, AuthorizationAgent>();

export function uuid2clientId(uuid: string) {
  return `${process.env.BASE_URL!}/agents/${uuid}`;
}

export function getClientIdKey(clientId: string): string {
  return `clientId:${clientId}`;
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

export class SessionManager {
  constructor(public storage: IStorage) {}

  async get(webId: string): Promise<AuthorizationAgent | undefined> {
    const cached = cache.get(webId);
    if (cached) return cached;
    const oidcSession = await getSessionFromStorage(webId, this.storage);
    if (oidcSession) {
      const saiSession = await buildSaiSession(oidcSession, oidcSession.info.clientAppId!);
      cache.set(webId, saiSession);
      return saiSession;
    }
  }

  async getFromUuid(uuid: string): Promise<AuthorizationAgent | undefined> {
    const clientId = uuid2clientId(uuid);
    const webId = await this.getWebId(clientId);
    return webId ? this.get(webId) : undefined;
  }

  async getWebId(clientId: string): Promise<string | undefined> {
    return this.storage.get(getClientIdKey(clientId));
  }
}
