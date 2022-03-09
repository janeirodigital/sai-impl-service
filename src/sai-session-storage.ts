
import { randomUUID } from "crypto";
import { getSessionFromStorage, Session } from "@inrupt/solid-client-authn-node";
import { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent";
import { RedisStorage } from "./redis-storage";

type WebId = string;

const cache = new Map<WebId, AuthorizationAgent>();

export function uuid2clientId(uuid: string) {
  return `${process.env.BASE_URL!}/agents/${uuid}`
}

async function buildSaiSession(oidcSession: Session, clientId: string): Promise<AuthorizationAgent> {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const webId = oidcSession.info.webId!
  return AuthorizationAgent.build(webId, clientId, {
        fetch: oidcSession.fetch,
        randomUUID,
      });
}

const storage = {
  get: async (webId: string): Promise<AuthorizationAgent | undefined> => {
    const cached = cache.get(webId)
    if (cached) return cached

    const oidcSession = await getSessionFromStorage(webId, RedisStorage.instance)
    if (oidcSession) {
      const clientId = await RedisStorage.instance.getClientId(oidcSession.info.webId!)
      const saiSession = await buildSaiSession(oidcSession, clientId!)
      cache.set(webId, saiSession);
      return saiSession
    }
  },
  getFromUuid: async (uuid: string): Promise<AuthorizationAgent | undefined> => {
    const clientId = uuid2clientId(uuid)
    const webId = await RedisStorage.instance.getWebId(clientId)
    return webId ? storage.get(webId) : undefined
  }
}
export default storage;
