import 'dotenv/config';
import { from, Observable } from "rxjs";
import { HttpHandler, HttpHandlerResponse } from "@digita-ai/handlersjs-http";
import { INTEROP } from "@janeirodigital/interop-namespaces";
import { AuthnContext } from "../models/http-solid-context";
import { agentRedirectUrl, agentUrl2webId } from "../url-templates";
import { ISessionManager } from "@janeirodigital/sai-server-interfaces";

export class AgentsHandler extends HttpHandler {
  constructor(
    private sessionManager: ISessionManager,
  ) {
    super();
  }

  /*
   * If WebID from the request is the same as WebID associated with AuthZ Agent, finds Application Registration.
   * Otherwise finds Social Agent Registration for WebID from the request.
   */
  async findAgentRegistration(webIdFromRequest: string, applicationId: string, agentUrl: string): Promise<string | undefined> {
    const sai = await this.sessionManager.getSaiSession(agentUrl2webId(agentUrl));

    if (sai.webId === webIdFromRequest) {
       return (await sai.findApplicationRegistration(applicationId))?.iri
    } else {
       return (await sai.findSocialAgentRegistration(webIdFromRequest))?.iri
    }
  }

  async handleAsync(context: AuthnContext): Promise<HttpHandlerResponse> {
    const agentUrl = context.request.url.toString()
    if (!context.authn.authenticated) {
      return {
        body: this.clientIdDocument(agentUrl),
        status: 200,
        headers: { 'Content-Type': 'application/ld+json' }
      }
    }
    const registrationIri = await this.findAgentRegistration(context.authn.webId, context.authn.clientId, agentUrl)
    const headers : { [key: string]: string} = {}
    if (registrationIri) {
        headers['Content-Type'] = 'application/ld+json'
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        headers['Link'] = `<${context.authn.clientId}>; anchor="${registrationIri}"; rel="${INTEROP.registeredAgent.value}"`
    }
    return {
      body: this.clientIdDocument(agentUrl),
      status: 200,
      headers
    }
  }


  clientIdDocument (agentUrl: string) {
    return {
      '@context': 'https://www.w3.org/ns/solid/oidc-context.jsonld',
      client_id: agentUrl,
      client_name: 'Solid Authorization Agent',
      redirect_uris: [ agentRedirectUrl(agentUrl) ],
      grant_types : ['refresh_token','authorization_code'],
      authorization_redirect_uri: process.env.FRONTEND_AUTHORIZATION_URL!
    }
  }

  handle(context: AuthnContext): Observable<HttpHandlerResponse> {
    return from(this.handleAsync(context))
  }
}
