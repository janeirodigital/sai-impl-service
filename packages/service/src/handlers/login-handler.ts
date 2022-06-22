import "dotenv/config";
import { randomUUID } from "crypto";
import { from, Observable } from "rxjs";
import { HttpHandler, HttpHandlerResponse, BadRequestHttpError } from "@digita-ai/handlersjs-http";
import { getLoggerFor } from '@digita-ai/handlersjs-logging';
import { Session } from "@inrupt/solid-client-authn-node";
import { ISessionManager } from "@janeirodigital/sai-server-interfaces";
import { agentRedirectUrl, uuid2agentUrl } from "../url-templates";
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

    let agentUrl: string

    const webId = context.authn.webId

    // see if authorization agent exists for that WebID use it
    let oidcSession = await this.sessionManager.getOidcSession(webId)

    if (oidcSession && oidcSession.info.isLoggedIn) {
      return { status: 204, headers: {} }
    } else if (oidcSession) {
      agentUrl = oidcSession.info.clientAppId!
    } else {
      agentUrl = uuid2agentUrl(randomUUID())
      oidcSession = new Session({ storage: this.sessionManager.storage, }, webId);
      await this.sessionManager.setAgentUrl2WebIdMapping(agentUrl, webId)
    }

    const completeRedirectUrl: string = await new Promise((resolve) => {
      oidcSession!.login({
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
