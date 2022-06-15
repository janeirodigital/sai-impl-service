import { IStorage } from "@inrupt/solid-client-authn-node"

/**
 * @hidden
 */
export class InMemoryStorage implements IStorage {
  private map: Record<string, string> = {};

  async get(key: string): Promise<string | undefined> {
    return this.map[key] || undefined;
  }

  async set(key: string, value: string): Promise<void> {
    this.map[key] = value;
  }

  async delete(key: string): Promise<void> {
    delete this.map[key];
  }
}
