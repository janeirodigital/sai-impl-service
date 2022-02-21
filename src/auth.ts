import { randomUUID } from "crypto";
import express, { Response, Request } from "express";
import { getSessionFromStorage, Session } from "@inrupt/solid-client-authn-node";

import { storage, uuid2clientId } from "./sai-session-storage";

export const redirectUrl = `${process.env.BASE_URL}/auth/handleLoginRedirect`;

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

  const oidcSession = new Session({
    storage: storage.oidcStorage,
  });

  req.session["sessionId"] = oidcSession.info.sessionId;

  const redirectToIdp = (url: string) => {
    res.send(url);
  };

  await oidcSession.login({
    redirectUrl,
    oidcIssuer: idp,
    clientName: process.env.APP_NAME,
    clientId: uuid2clientId(randomUUID()),
    handleRedirect: redirectToIdp,
  });
});

router.get("/handleLoginRedirect", async (req: Request, res: Response) => {
  if (!req.session || !req.session["sessionId"]) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    res.redirect(process.env.BASE_URL!);
    return;
  }

  const oidcSession = await getSessionFromStorage(req.session["sessionId"], storage.oidcStorage);

  if (!oidcSession) {
    res.redirect(401, process.env.BASE_URL + "/login");
    return;
  }

  await oidcSession.handleIncomingRedirect(process.env.BASE_URL + "/auth" + req.url);

  if (oidcSession.info.isLoggedIn && oidcSession.info.webId) {
    await storage.changeKey(req.session["sessionId"], oidcSession.info.webId);
    delete req.session["sessionId"];
    req.session["webId"] = oidcSession.info.webId;
    res.redirect(200, process.env.BASE_URL + "/dashboard");
  }
});

export default router;
