import { NextFunction, Request, Response } from "express";
import SessionStorage from "./session-storage";
import { getSessionFromStorage, Session } from "@inrupt/solid-client-authn-node";
import { RedisStorage } from "./redis-storage";
import { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent";
import { randomUUID } from "crypto";

function webId2agentId(webId: string) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return `${process.env.SERVICE_URL!}/agent/${Buffer.from(webId).toString('base64')}`
}

export async function buildSaiSession(oidcSession: Session): Promise<AuthorizationAgent> {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const webId = oidcSession.info.webId!
  return AuthorizationAgent.build(webId, webId2agentId(webId), {
        fetch: oidcSession.fetch,
        randomUUID,
      });

}

const sessionGuard = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.cookies["session"]) return rejectNoSessionProvided(res);

  try {
    const cookieValue = Buffer.from(req.cookies["session"], "base64").toString("utf-8");
    const sessionId = JSON.parse(cookieValue)["sessionId"];
    if (!sessionId) return rejectNoSessionProvided(res);

    const session = await getSessionFromStorage(sessionId, RedisStorage.instance);
    if (!session || !session.info.isLoggedIn || !session.info.webId)
      return rejectNoSessionFound(res);

    req.webId = session.info.webId;

    const sai = SessionStorage.get(sessionId);
    if (!sai) {
      // TODO (angel) check config values prior to program startup
      req.sai = await buildSaiSession(session)
    } else req.sai = sai;

    next();
  } catch (e) {
    // TODO (angel) log and better error message
    res.status(500).json(JSON.stringify(e));
  }
};

const rejectNoSessionProvided = (res: Response) => {
  res.status(401).json({
    message: `No session provided`,
  });
};

const rejectNoSessionFound = (res: Response) => {
  res.status(401).json({
    message: `No session found`,
  });
};
export default sessionGuard;
