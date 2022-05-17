import { from, Observable } from "rxjs";
import { HttpHandler, HttpHandlerResponse } from "@digita-ai/handlersjs-http";
import { INTEROP } from "@janeirodigital/interop-namespaces";
import { HttpSolidContext } from "../models/http-solid-context";
import { SessionManager } from "../sai-session-storage";
import { agentUrl, agentRedirectUrl } from "../url-templates";

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

  async handleAsync(context: HttpSolidContext): Promise<HttpHandlerResponse> {
    const agentUuid = context.request.parameters!.uuid
    if (!context.authn) {
      return {
        body: this.clientIdDocument(agentUuid),
        status: 200,
        headers: { 'Content-Type': 'application/ld+json' }
      }
    }
    if(!context.authn.clientId) {
      // TODO: add logging
      // throw Error('no client_id present in the token')
      return { status: 401, headers: {} }
    }
    const registrationIri = await this.findAgentRegistration(context.authn.webId, context.authn.clientId, agentUuid)
    const headers : { [key: string]: string} = {}
    if (registrationIri) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        headers['Link'] = `<${context.authn.clientId}>; anchor="${registrationIri}"; rel="${INTEROP.registeredAgent.value}"`
    }
    return { status: 200, headers, body: this.clientIdDocument(agentUuid)}
  }


  clientIdDocument (agentUuid: string) {
    return {
      '@context': 'https://www.w3.org/ns/solid/oidc-context.jsonld',
      client_id: agentUrl(agentUuid),
      client_name: 'Solid Authorization Agent',
      redirect_uris: [ agentRedirectUrl(agentUuid) ],
      grant_types : ['refresh_token','authorization_code']
    }
  }

  handle(context: HttpSolidContext): Observable<HttpHandlerResponse> {
    return from(this.handleAsync(context))
  }
}
