import { HttpHandler, HttpHandlerContext, HttpHandlerResponse } from "@digita-ai/handlersjs-http";
import { catchError, from, iif, map, mergeMap, Observable, of, switchMap } from "rxjs";
import { getSessionFromStorage, Session } from "@inrupt/solid-client-authn-node";
import { SessionManager, uuid2clientId } from "../sai-session-storage";
import { randomUUID } from "crypto";
import { MiddlewareHttpHandler } from "./middleware-http-handler";
import { HttpSolidContext } from "../models/http-solid-context";
import { createSolidTokenVerifier, DPoPOptions, RequestMethod, SolidAccessTokenPayload } from "@solid/access-token-verifier";
import { redirectUrl } from './login-handler'
import { Token } from "n3";
import { INTEROP } from "@janeirodigital/interop-namespaces";

export class AgentsHandler extends HttpHandler {
  constructor(
    private sessionManager: SessionManager,
  ) {
    super();
  }

  async findAgentRegistration(webid: string, applicationId: string, agentUuid: string): Promise<string | undefined> {
    const sai = await this.sessionManager.getFromUuid(agentUuid);
    if (sai) {
      if (sai.webId === webid) {
         return (await sai.findApplicationRegistration(applicationId))?.iri
      } else {
         return (await sai.findSocialAgentRegistration(webid))?.iri
      }
    }
  }

  async handleAsync(agentUuid: string, authorizationHeader: string, dpop?: DPoPOptions): Promise<HttpHandlerResponse> {
    const verifier = createSolidTokenVerifier()
    let token: SolidAccessTokenPayload
    try {
      token = await verifier(authorizationHeader, dpop);
    } catch (error: unknown) {
      // TODO: add logging
      // const message = `Error verifying WebID via DPoP-bound access token: ${(error as Error).message}`;
      return { status: 401, headers: {} }
    }
    if(!token.client_id) {
      // TODO: add logging
      // throw Error('no client_id present in the token')
      return { status: 401, headers: {} }
    }
    const registrationIri = await this.findAgentRegistration(token.webid, token.client_id, agentUuid)
    const headers : { [key: string]: string} = {}
    if (registrationIri) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        headers['Link'] = `<${token.client_id}>; anchor="${registrationIri}"; rel="${INTEROP.registeredAgent.value}"`
    }
    return { status: 200, headers, body: this.clientIdDocument(agentUuid)}
  }


  clientIdDocument (agentUuid: string) {
    return {
      '@context': 'https://www.w3.org/ns/solid/oidc-context.jsonld',
      client_id: uuid2clientId(agentUuid),
      client_name: 'Solid Authorization Agent',
      redirect_uris: [ redirectUrl ],
      grant_types : ['refresh_token','authorization_code']
    }
  }

  handle(context: HttpSolidContext): Observable<HttpHandlerResponse> {
    const verifier = createSolidTokenVerifier()
    // TODO: check if handler makes headers lowercased
    const { headers: { Authorization: authorization, DPoP: dpop }, method } = context.request;
    if (!authorization && !dpop) {
      return of({
        body: this.clientIdDocument(context.request.parameters!.uuid),
        status: 200,
        headers: { 'Content-Type': 'application/ld+json' }
      });
    }

    if (!authorization || !dpop) {
      return of({ headers: {}, status: 400 });
    }

    return from(this.handleAsync(
      context.request.parameters!.uuid,
      authorization,
      {
        header: dpop as string,
        method: method as RequestMethod,
        url: `${process.env.BASE_URL}${context.request.url}`,
      }
    ))
  }
}
