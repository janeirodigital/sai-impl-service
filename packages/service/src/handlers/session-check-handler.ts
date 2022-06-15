import { HttpHandler, HttpHandlerResponse } from "@digita-ai/handlersjs-http";
import { from, Observable } from "rxjs";
import { getSessionFromStorage } from "@inrupt/solid-client-authn-node";
import { ISessionManager } from "@janeirodigital/sai-server-interfaces";
import { AuthnContext } from "../models/http-solid-context";


/**
 * Check if a OIDC session exists on the server side. Used by the front ends.
 */
export class SessionCheckHandler implements HttpHandler {

  constructor(
    private sessionManager: ISessionManager,
  ) {}

  handle(ctx: AuthnContext): Observable<HttpHandlerResponse> {
    return from(this.handleAsync(ctx));
  }

  private async handleAsync(ctx: AuthnContext): Promise<HttpHandlerResponse> {

    const session = await getSessionFromStorage(ctx.authn.webId, this.sessionManager.storage);
    const found = !!(session && session.info.isLoggedIn);

    return {
      status: 200,
      body: {
        found,
      },
      headers: {}
    };
  }
}
