import express, { Request, Response } from "express";
import { createSolidTokenVerifier, RequestMethod } from '@solid/access-token-verifier';
import { INTEROP } from "@janeirodigital/interop-namespaces";
import SessionStorage from "./session-storage";

const usersRouter = express.Router({ caseSensitive: false });

usersRouter.get("/:webIdB64", async (req: Request, res: Response) => {

  const webIdFromAgent = Buffer.from(req.params.webIdB64, "base64").toString("utf-8")
  console.log(webIdFromAgent)
  const sai = SessionStorage.get(webIdFromAgent);

  // TODO rethink how SessionStorage gets pupulated from redis - most likely on start
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
      authorization!,
      {
        header: dpop as string,
        method: method as RequestMethod,
        url: `${process.env.SERVICE_URL}/users${req.url}`,
      },
    );
    webIdFromToken = token.webid
    applicationId = token.client_id

  } catch (error: unknown) {
    const message = `Error verifying WebID via DPoP-bound access token: ${(error as Error).message}`;
    throw new Error(message);
  }

  let registrationIri: string
  if (webIdFromAgent === webIdFromToken) {
    // registration owner wants to discover application registrataion
    // TODO sai-js: provide sai.findApplicationRegistration(clientId)
    for await (const registration of sai.applicationRegistrations) {
      if (registration.registeredAgent === applicationId) {
        registrationIri = registration.iri
        break;
      }
    }
  } else {
    // another end-end user wants to discover social agent registartion
    // TODO sai-js: provide sai.findSocialAgentRegistration(webId)
    for await (const registration of sai.socialAgentRegistrations) {
      if (registration.registeredAgent === webIdFromToken) {
        registrationIri = registration.iri
        break;
      }
    }
  }

  // TODO: if (!registrationIri)
  res
    .status(200)
    .header("content-type", "text/turtle")
    .header(
      "Link",
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      `<${applicationId}>; anchor="${registrationIri!}"; rel="${INTEROP.registeredAgent.value}"`
    )
    .send();
});

export default usersRouter;
