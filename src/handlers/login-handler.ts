import 'dotenv/config';
import { randomUUID } from "crypto";
import { from, map, Observable, of } from "rxjs";
import { HttpHandler, HttpHandlerResponse } from "@digita-ai/handlersjs-http";
import { Session } from "@inrupt/solid-client-authn-node";
import { SessionManager } from "../sai-session-storage";
import { uuid2agentUrl, agentRedirectUrl } from "../url-templates";
import { HttpSolidContext } from "../models/http-solid-context";

export class LoginHandler extends HttpHandler {
  constructor(
    private sessionManager: SessionManager
  ) {
    super();
    console.log("LoginHandler::constructor");
  }

  async handleAsync (context: HttpSolidContext): Promise<HttpHandlerResponse> {
    if (!context.authn) {
      return {
        status: 401,
        headers: {},
      };
    }

    const idp = context.request.body?.idp;
    if (!idp) {
      return {
        body: { message: "No Identity or Identity Provider sent with the request" },
        status: 400,
        headers: {},
      };
    }

    let agentUrl: string

    const webId = context.authn!.webId

    // see if authorization agent exists for that WebID use it
    let oidcSession = await this.sessionManager.getOidcSession(webId)

    if (oidcSession) {
      agentUrl = oidcSession.info.clientAppId!
    } else {
      agentUrl = uuid2agentUrl(randomUUID())
      oidcSession = new Session({ storage: this.sessionManager.storage, }, webId);
      await this.sessionManager.setAgentUrl2WebIdMapping(agentUrl, webId)
    }

    const completeRedirectUrl: string = await new Promise((resolve, reject) => {
      oidcSession!.login({
        redirectUrl: agentRedirectUrl(agentUrl),
        oidcIssuer: idp,
        clientName: process.env.APP_NAME,
        clientId: agentUrl,
        handleRedirect: (url) => {
          resolve(url)
        }
      })
    })
    return { body: { redirectUrl: completeRedirectUrl }, status: 200, headers: {} }

  }

  handle(context: HttpSolidContext): Observable<HttpHandlerResponse> {
    console.log("LoginHandler::handle");
    return from(this.handleAsync(context))
  }
}
