import { from, Observable } from "rxjs";
import { HttpHandler, HttpHandlerResponse, NotFoundHttpError } from "@digita-ai/handlersjs-http";
import { getSessionFromStorage } from "@inrupt/solid-client-authn-node";
import { getLoggerFor } from '@digita-ai/handlersjs-logging';
import { HttpHandlerContext, InternalServerError } from "@digita-ai/handlersjs-http";
import { frontendUrl, uuid2agentUrl } from "../url-templates";
import { ISessionManager } from "@janeirodigital/sai-server-interfaces";
import { SessionManager } from "../session-manager";

export class LoginRedirectHandler extends HttpHandler {

  private logger = getLoggerFor(this, 5, 5);

  constructor(
    private sessionManager: ISessionManager
  ) {
    super();
    this.logger.info("LoginRedirectHandler::constructor");
  }
  handle(context: HttpHandlerContext): Observable<HttpHandlerResponse> {
    this.logger.info("LoginRedirectHandler::handle");
    return from(this.handleAsync(context))

  }

  private async handleAsync(context: HttpHandlerContext): Promise<HttpHandlerResponse> {
    const agentUrl = uuid2agentUrl(context.request.parameters!.uuid)
    const webId = await this.sessionManager.getWebId(agentUrl)

    if (!webId) {
      throw new NotFoundHttpError()
    }
    const oidcSession = await this.sessionManager.getOidcSession(webId)

    if (!oidcSession) {
      // TODO clarify this scenario
      throw new InternalServerError()
    }
    await oidcSession.handleIncomingRedirect(context.request.url.toString())

    if (!oidcSession.info.isLoggedIn || !oidcSession.info.webId) {
      // TODO clarify this scenario
      throw new InternalServerError()
    } else {
      return { body: {}, status: 302, headers: { location: frontendUrl } };
    }
  }
}
