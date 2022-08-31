import "dotenv/config";
import { from, Observable } from "rxjs";
import { HttpHandler, HttpHandlerResponse, BadRequestHttpError } from "@digita-ai/handlersjs-http";
import { getLoggerFor } from '@digita-ai/handlersjs-logging';
import { ISessionManager } from "@janeirodigital/sai-server-interfaces";
import { agentRedirectUrl, webId2agentUrl } from "../url-templates";
import { AuthenticatedAuthnContext } from "../models/http-solid-context";
import { validateContentType } from "../utils/http-validators";

export class LoginHandler extends HttpHandler {
  private logger = getLoggerFor(this, 5, 5);

  constructor(
    private sessionManager: ISessionManager
  ) {
    super();
    this.logger.info("LoginHandler::constructor");
  }

  async handleAsync (context: AuthenticatedAuthnContext): Promise<HttpHandlerResponse> {

    validateContentType(context, 'application/json');

    const idp: string = context.request.body?.idp;

    if (!idp) {
      throw new BadRequestHttpError('No Identity or Identity Provider sent with the request')
    }

    const webId = context.authn.webId

    const oidcSession = await this.sessionManager.getOidcSession(webId)

    if (oidcSession.info.isLoggedIn) {
      return { status: 204, headers: {} }
    }

    const agentUrl = webId2agentUrl(webId)

    const completeRedirectUrl: string = await new Promise((resolve) => {
      oidcSession.login({
        redirectUrl: agentRedirectUrl(agentUrl),
        oidcIssuer: idp,
        clientName: process.env.APP_NAME,
        clientId: agentUrl,
        handleRedirect: (url: string) => {
          resolve(url)
        }
      })
    });

    return { body: { redirectUrl: completeRedirectUrl }, status: 200, headers: {} }
  }

  handle(context: AuthenticatedAuthnContext): Observable<HttpHandlerResponse> {
    this.logger.info("LoginHandler::handle");
    return from(this.handleAsync(context))
  }
}
