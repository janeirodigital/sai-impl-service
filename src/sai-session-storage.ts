
import { randomUUID } from "crypto";
import { getSessionFromStorage, Session } from "@inrupt/solid-client-authn-node";
import { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent";
import { RedisStorage } from "./redis-storage";

type WebId = string;

const cache = new Map<WebId, AuthorizationAgent>();

function webId2agentId(webId: string) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return `${process.env.BASE_URL!}/users/${Buffer.from(webId).toString('base64')}`
}

async function buildSaiSession(oidcSession: Session): Promise<AuthorizationAgent> {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const webId = oidcSession.info.webId!
  return AuthorizationAgent.build(webId, webId2agentId(webId), {
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
      const saiSession = await buildSaiSession(oidcSession)
      cache.set(webId, saiSession);
      return saiSession
    }
  }
}
export default storage;
