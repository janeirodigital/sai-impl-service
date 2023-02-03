

export class RedisConnectionInfo {
  constructor(
    public host?: string,
    public port?: number,
    public username?: string,
    public password?: string,
    public db?: number,
  ) {}
}