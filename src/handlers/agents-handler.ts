import { from, Observable } from "rxjs";
import { HttpHandler, HttpHandlerResponse } from "@digita-ai/handlersjs-http";
import { INTEROP } from "@janeirodigital/interop-namespaces";
import { HttpSolidContext } from "../models/http-solid-context";
import { uuid2agentUrl, agentRedirectUrl } from "../url-templates";
import { ISessionManager } from "../interfaces/i-session-manager";

export class AgentsHandler extends HttpHandler {
  constructor(
    private sessionManager: ISessionManager,
  ) {
    super();
  }

  async findAgentRegistration(webid: string, applicationId: string, agentUrl: string): Promise<string | undefined> {
    const sai = await this.sessionManager.getFromAgentUrl(agentUrl);
    if (sai) {
      if (sai.webId === webid) {
         return (await sai.findApplicationRegistration(applicationId))?.iri
      } else {
         return (await sai.findSocialAgentRegistration(webid))?.iri
      }
    }
  }

  async handleAsync(context: HttpSolidContext): Promise<HttpHandlerResponse> {
    const agentUrl = uuid2agentUrl(context.request.parameters!.uuid)
    if (!context.authn) {
      return {
        body: this.clientIdDocument(agentUrl),
        status: 200,
        headers: { 'Content-Type': 'application/ld+json' }
      }
    }
    if(!context.authn.clientId) {
      // TODO: add logging
      // throw Error('no client_id present in the token')
      return { status: 401, headers: {} }
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

  handle(context: HttpSolidContext): Observable<HttpHandlerResponse> {
    return from(this.handleAsync(context))
  }
}
