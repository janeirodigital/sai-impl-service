import express, { Request, Response } from "express";
import jwtDecode from "jwt-decode";
import { INTEROP } from "@janeirodigital/interop-namespaces";
import SessionStorage from "./session-storage";

const usersRouter = express.Router({ caseSensitive: false });

usersRouter.get("/:webIdB64", async (req: Request, res: Response) => {

  const webIdFromAgent = Buffer.from(req.params.webIdB64, "base64").toString("utf-8")
  console.log(webIdFromAgent)
  const sai = SessionStorage.get(webIdFromAgent);

  // TODO rething how SessionStorage gets pupulated from redis - most likely on start
  if (!sai) {
    res.status(404).send();
    return;
  }

  const tokenHeader = req.header("Authorization")?.split(" ")[1]; // Leave the `DPoP ` behind.

  if (!tokenHeader) {
    res.status(401).send();
    return;
  }

  // TODO (angel) verify that the token is valid. jwtDecode does not perform signature verification
  // TODO solid-oidc : update to azp once changed to uma style as
  const { webid: webIdFromToken, client_id: applicationId } = jwtDecode<{ webid: string, client_id: string }>(tokenHeader);

  let registrationIri: string
  if (webIdFromAgent === webIdFromToken) {
    // registration owner wants to discover applicatiaon registrqtaion
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

  res
    .status(200)
    .header("content-type", "text/turtle")
    .header(
      "Link",
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      `<${applicationId}>; anchor="${registrationIri!}"; rel="${INTEROP.registeredAgent.value}"`
    )
    .send();


  res.status(401).header("content-type", "text/turtle").send();
});

export default usersRouter;
