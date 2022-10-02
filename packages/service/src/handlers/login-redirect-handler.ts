import { from, Observable } from "rxjs";
import { HttpHandler, HttpHandlerResponse, HttpHandlerContext, InternalServerError } from "@digita-ai/handlersjs-http";
import { getLoggerFor } from '@digita-ai/handlersjs-logging';
import type { ISessionManager } from "@janeirodigital/sai-server-interfaces";
import { frontendUrl, decodeWebId } from "../url-templates";

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
    const webId = decodeWebId(context.request.parameters!.encodedWebId)

    const oidcSession = await this.sessionManager.getOidcSession(webId)
    // TODO clarify scenario if new a session was just created

    await oidcSession.handleIncomingRedirect(context.request.url.toString())

    if (!oidcSession.info.isLoggedIn || !oidcSession.info.webId) {
      // TODO clarify this scenario
      throw new InternalServerError()
    } else {
      return { body: {}, status: 302, headers: { location: frontendUrl } };
    }
  }
}
