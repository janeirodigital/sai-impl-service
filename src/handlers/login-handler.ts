import 'dotenv/config';
import { randomUUID } from "crypto";
import { from, map, Observable, of } from "rxjs";
import { HttpHandler, HttpHandlerResponse } from "@digita-ai/handlersjs-http";
import { Session } from "@inrupt/solid-client-authn-node";
import { SessionManager } from "../sai-session-storage";
import { agentUrl, agentRedirectUrl } from "../url-templates";
import { HttpSolidContext } from "../models/http-solid-context";

export class LoginHandler extends HttpHandler {
  constructor(
    private sessionManager: SessionManager
  ) {
    super();
    console.log("LoginHandler::constructor");
  }

  async handleAsync (context: HttpSolidContext): Promise<HttpHandlerResponse> {
    const idp = context.request.body["idp"];

    if (!context.authn) {
      return {
        status: 401,
        headers: {},
      };
    }

    if (!idp) {
      return {
        body: { message: "No Identity or Identity Provider sent with the request" },
        status: 400,
        headers: {},
      };
    }

    const webId = context.authn!.webId
    const agentUuid = randomUUID()
    const clientId = agentUrl(agentUuid)

    const oidcSession = new Session({
      storage: this.sessionManager.storage,
    }, webId);

    await this.sessionManager.setClientId2WebIdMapping(clientId, webId)

    const completeRedirectUrl: string = await new Promise((resolve, reject) => {
      oidcSession.login({
        redirectUrl: agentRedirectUrl(agentUuid),
        oidcIssuer: idp,
        clientName: process.env.APP_NAME,
        clientId,
        handleRedirect: (url) => {
          resolve(url)
        }
      })
    })
    return { body: {}, status: 300, headers: { location: completeRedirectUrl } }

  }

  handle(context: HttpSolidContext): Observable<HttpHandlerResponse> {
    console.log("LoginHandler::handle");
    return from(this.handleAsync(context))
  }
}
