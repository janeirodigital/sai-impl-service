import { from, Observable } from "rxjs";
import { HttpHandler, HttpHandlerResponse, UnauthorizedHttpError } from "@digita-ai/handlersjs-http";
import { INTEROP } from "@janeirodigital/interop-namespaces";
import { AuthnContext } from "../models/http-solid-context";
import { agentRedirectUrl, agentUrl2webId } from "../url-templates";
import { ISessionManager } from "@janeirodigital/sai-server-interfaces";
import { NotFoundHttpError } from "@digita-ai/handlersjs-http";

export class AgentsHandler extends HttpHandler {
  constructor(
    private sessionManager: ISessionManager,
  ) {
    super();
  }

  async findAgentRegistration(webid: string, applicationId: string, agentUrl: string): Promise<string | undefined> {
    const webId = agentUrl2webId(agentUrl)
    const sai = await this.sessionManager.getSaiSession(webId);

    if (sai.webId === webid) {
       return (await sai.findApplicationRegistration(applicationId))?.iri
    } else {
       return (await sai.findSocialAgentRegistration(webid))?.iri
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
      grant_types : ['refresh_token','authorization_code']
    }
  }

  handle(context: AuthnContext): Observable<HttpHandlerResponse> {
    return from(this.handleAsync(context))
  }
}
