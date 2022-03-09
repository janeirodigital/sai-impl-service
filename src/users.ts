import express, { Request, Response } from "express";
import { createSolidTokenVerifier, RequestMethod } from '@solid/access-token-verifier';
import { INTEROP } from "@janeirodigital/interop-namespaces";
import SaiSessionStorage from "./sai-session-storage";

const usersRouter = express.Router({ caseSensitive: false });

usersRouter.get("/:webIdB64", async (req: Request, res: Response) => {

  const webIdFromAgent = Buffer.from(req.params.webIdB64, "base64").toString("utf-8")
  const sai = await SaiSessionStorage.get(webIdFromAgent);

  if (!sai) {
    res.status(404).send();
    return;
  }

  const verifier = createSolidTokenVerifier()
  const { headers: { authorization, dpop }, method } = req;
  if (!authorization || !dpop) {
    res.status(401).send();
    return;
  }
  // TODO solid-oidc : update to azp once changed to uma style as
  let webIdFromToken, applicationId
  try {
    const token = await verifier(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      authorization,
      {
        header: dpop as string,
        method: method as RequestMethod,
        url: `${process.env.BASE_URL}/users${req.url}`,
      },
    );
    webIdFromToken = token.webid
    applicationId = token.client_id

  } catch (error: unknown) {
    const message = `Error verifying WebID via DPoP-bound access token: ${(error as Error).message}`;
    throw new Error(message);
  }

  let registrationIri: string | undefined
  if (webIdFromAgent === webIdFromToken) {
    if(!applicationId) {
      throw Error('no client_id present in the token')
    } else {
      registrationIri = (await sai.findApplicationRegistration(applicationId))?.iri
    }
  } else {
      registrationIri = (await sai.findSocialAgentRegistration(webIdFromToken))?.iri
  }

  res
    .status(200)
    .header("content-type", "text/turtle")
  if (registrationIri) {
    res.header(
      "Link",
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      `<${applicationId}>; anchor="${registrationIri}"; rel="${INTEROP.registeredAgent.value}"`
    )
  }
  res.send();
});

export default usersRouter;
