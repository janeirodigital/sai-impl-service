import express, { Response, Request } from "express";
import { getSessionFromStorage, Session } from "@inrupt/solid-client-authn-node";
import { AuthorizationAgent } from "@janeirodigital/authorization-agent";
import { randomUUID } from "crypto";

import SessionStorage from "./session-storage.js";
import { RedisStorage } from "./redis-storage";

const router = express.Router({ caseSensitive: false });

router.post("/login", async (req: Request, res: Response) => {
  console.log("[POST][LOGIN] /login handler");
  const idp = req.body["idp"];

  if (!idp || !req.session) {
    res.status(400).json({
      message: "No Identity Provided sent with the request",
    });
    return;
  }

  const storage = RedisStorage.instance;

  const session = new Session({
    storage,
  });

  req.session["sessionId"] = session.info.sessionId;

  const redirectToIdp = (url: string) => {
    res.send(url);
  };
  await session.login({
    redirectUrl: `${process.env.BASE_URL}/auth/handleLoginRedirect`,
    oidcIssuer: idp,
    clientName: process.env.APP_NAME,
    handleRedirect: redirectToIdp,
  });
});

router.get("/handleLoginRedirect", async (req: Request, res: Response) => {
  if (!req.session || !req.session["sessionId"]) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    res.redirect(process.env.BASE_URL!);
    return;
  }

  const solidSession = await getSessionFromStorage(req.session["sessionId"], RedisStorage.instance);

  if (!solidSession) {
    res.redirect(401, process.env.BASE_URL + "/login");
    return;
  }

  await solidSession.handleIncomingRedirect(process.env.BASE_URL + "/auth" + req.url);

  // TODO (angel) check if instead of using the .cookies accessor it is possible to use the .session.sessionId
  //              accessor. That might be enough to remove the cookie-parser dependency
  const sessionCookie = req.cookies["session"];
  if (solidSession.info.isLoggedIn && solidSession.info.webId) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const saiSession = await AuthorizationAgent.build(
      solidSession.info.webId,
      process.env.AGENT_ID!,
      {
        fetch: solidSession.fetch,
        randomUUID,
      }
    );

    SessionStorage.set(solidSession.info.sessionId, saiSession);

    res.cookie("session", sessionCookie, { httpOnly: true });
    res.redirect(200, process.env.BASE_URL + "/dashboard");
  }
});

export default router;
