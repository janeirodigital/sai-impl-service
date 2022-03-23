
import { randomUUID } from "crypto";
import { getSessionFromStorage, Session } from "@inrupt/solid-client-authn-node";
import { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent";
import { RedisStorage } from "./redis-storage";

type WebId = string;

const cache = new Map<WebId, AuthorizationAgent>();

export function uuid2clientId(uuid: string) {
  return `${process.env.BASE_URL!}/agents/${uuid}`
}

// TODO remove this copy of StorageUtility method from inrupt's module
function getWebIdKey(webId: string): string {
  return `solidClientAuthenticationUser:${webId}`;
}
function getCookieSessionIdKey(cookieSessionId: string): string {
  return getWebIdKey(cookieSessionId)
}

function getClientIdKey(clientId: string): string {
  return `clientId:${clientId}`;
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
  oidcStorage: RedisStorage.instance,
  get: async (webId: string): Promise<AuthorizationAgent | undefined> => {
    const cached = cache.get(webId)
    if (cached) return cached

    const oidcSession = await getSessionFromStorage(webId, RedisStorage.instance)
    if (oidcSession) {
      const clientId = await storage.getClientId(oidcSession.info.webId!)
      const saiSession = await buildSaiSession(oidcSession, clientId!)
      cache.set(webId, saiSession);
      return saiSession
    }
  },
  getFromUuid: async (uuid: string): Promise<AuthorizationAgent | undefined> => {
    const clientId = uuid2clientId(uuid)
    const webId = await storage.getWebId(clientId)
    return webId ? storage.get(webId) : undefined
  },
  getClientId: async (webId: string): Promise<string | undefined> => {
    const value = await RedisStorage.instance.get(webId)
    return value ? JSON.parse(value).clientId : undefined
  },
  getWebId: async (clientId: string): Promise<string | undefined> => {
    return RedisStorage.instance.get(getClientIdKey(clientId))
  },
  // If there is a oidcSession for given WebID there will be ClientID -> WebID mapping as well
  changeKey: async (cookieSessionId: string, webId: string) => {
    const value = await RedisStorage.instance.get(getCookieSessionIdKey(cookieSessionId))
    if (value) {
      // Previous session can exist if user logged in from another browser or device
      // In that case discard the new one and keep using the old one with original ClientID -> WebID mapping
      const existingOidcSession = await RedisStorage.instance.get(getWebIdKey(webId))
      if (!existingOidcSession) {
        await RedisStorage.instance.set(getWebIdKey(webId), value)
        const clientId = JSON.parse(value).clientId
        await RedisStorage.instance.set(getClientIdKey(clientId), webId)
      }
      await RedisStorage.instance.delete(getCookieSessionIdKey(cookieSessionId))
    }
  }
}

export default storage;
