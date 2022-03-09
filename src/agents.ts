import express, { Request, Response } from "express";
import { createSolidTokenVerifier, RequestMethod } from '@solid/access-token-verifier';
import { INTEROP } from "@janeirodigital/interop-namespaces";
import SaiSessionStorage, { uuid2clientId } from "./sai-session-storage";
import { redirectUrl } from "./auth"

const agentsRouter = express.Router({ caseSensitive: false });


agentsRouter.get("/:uuid", async (req: Request, res: Response) => {

  const clientIddocument = {
    '@context': 'https://www.w3.org/ns/solid/oidc-context.jsonld',
    client_id: uuid2clientId(req.params.uuid),
    client_name: 'Solid Authorization Agent',
    redirect_uris: [ redirectUrl ],
    grant_types : ['refresh_token','authorization_code']
  }

  const verifier = createSolidTokenVerifier()
  let registrationIri: string | undefined
  let applicationId: string | undefined

  const { headers: { authorization, dpop }, method } = req;
  if (authorization && dpop) {
    // TODO solid-oidc : update to azp once changed to uma style as
    let webIdFromToken
    try {
      const token = await verifier(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        authorization,
        {
          header: dpop as string,
          method: method as RequestMethod,
          url: `${process.env.BASE_URL}/agents${req.url}`,
        },
      );
      webIdFromToken = token.webid
      applicationId = token.client_id

    } catch (error: unknown) {
      const message = `Error verifying WebID via DPoP-bound access token: ${(error as Error).message}`;
      throw new Error(message);
    }

    const sai = await SaiSessionStorage.getFromUuid(req.params.uuid);
    if (sai) {
      if (sai.webId === webIdFromToken) {
        if(!applicationId) {
          throw Error('no client_id present in the token')
        } else {
          registrationIri = (await sai.findApplicationRegistration(applicationId))?.iri
        }
      } else {
          registrationIri = (await sai.findSocialAgentRegistration(webIdFromToken))?.iri
      }
    }
  }

  res
    .status(200)
  if (registrationIri) {
    res.header(
      "Link",
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      `<${applicationId}>; anchor="${registrationIri}"; rel="${INTEROP.registeredAgent.value}"`
    )
  }
  res.send(clientIddocument);
});

export default agentsRouter;
