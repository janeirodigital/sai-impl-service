import { createClient } from "redis";
import { IStorage } from "@inrupt/solid-client-authn-node";

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

export class RedisStorage implements IStorage {
  private client;
  private static _instance: RedisStorage;

  private constructor() {
    this.client = createClient();
    this.client.on("error", (err) => {
      console.log("Critical Redis Error. Shutting down.");
      console.log(err);
      process.exit(1);
    });
    this.client.connect();
  }

  public static get instance(): RedisStorage {
    if (this._instance) {
      return this._instance;
    }

    this._instance = new RedisStorage();
    return this._instance;
  }

  async delete(key: string): Promise<void> {
    const result = await this.client.del(key).then();
    if (result > 0) return;
    else {
      return; // ??
    }
  }

  async get(key: string): Promise<string | undefined> {
      const value = await this.client.get(key);
      return value || undefined;
  }

  async set(key: string, value: string): Promise<void> {
    const result = await this.client.set(key, value);
    if (result == "OK") return;
  }

  async getClientId(webId: string): Promise<string | undefined> {
    const value = await this.get(webId)
    return value ? JSON.parse(value).clientId : undefined
  }

  async getWebId(clientId: string): Promise<string | undefined> {
    return this.get(getClientIdKey(clientId))
  }

  // If there is a oidcSession for given WebID there will be ClientID -> WebID mapping as well
  async rename(cookieSessionId: string, webId: string) {
    const value = await this.get(getCookieSessionIdKey(cookieSessionId))
    if (value) {
      // Previous session can exist if user logged in from another browser or device
      // In that case discard the new one and keep using the old one with original ClientID -> WebID mapping
      const existingOidcSession = await this.get(getWebIdKey(webId))
      if (!existingOidcSession) {
        await this.set(getWebIdKey(webId), value)
        const clientId = JSON.parse(value).clientId
        await this.set(getClientIdKey(clientId), webId)
      }
      await this.delete(getCookieSessionIdKey(cookieSessionId))
    }
  }
}
