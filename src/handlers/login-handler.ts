import { HttpHandler, HttpHandlerContext, HttpHandlerResponse } from "@digita-ai/handlersjs-http";
import { firstValueFrom, from, lastValueFrom, map, Observable, of } from "rxjs";
import { getSessionFromStorage, Session } from "@inrupt/solid-client-authn-node";
import { SessionManager, uuid2clientId } from "../sai-session-storage";
import { randomUUID } from "crypto";
import { redirectUrl } from "../auth";
import CookieSessionObject = CookieSessionInterfaces.CookieSessionObject;

export class LoginHandler extends HttpHandler {
  constructor(private sessionManager: SessionManager) {
    super();
    console.log("LoginHandler::constructor");
  }

  handle(input: HttpHandlerContext): Observable<HttpHandlerResponse> {
    console.log("LoginHandler::handle");
    if (input.route?.path === "login") {
      return this.handleLogin(input);
    } /* if (input.route?.path === 'handleLoginRedirect') */ else {
      return this.handleRedirect(input);
    }
  }

  private handleLogin(input: HttpHandlerContext): Observable<HttpHandlerResponse> {
    const idp = input.request.body["idp"];
    // @ts-ignore TODO change the type of request to use the types that include the session
    const session = input.request.session;

    if (!idp || !session) {
      return of({
        body: { message: "No Identity Provided sent with the request" },
        status: 400,
        headers: {},
      });
    }

    const oidcSession = new Session({
      storage: this.sessionManager.storage,
    });

    session["sessionId"] = oidcSession.info.sessionId;

    const redirectToIdp = (url: string) =>
      of({ body: {}, status: 300, headers: { location: url } });

    return from(
      oidcSession.login({
        redirectUrl,
        oidcIssuer: idp,
        clientName: process.env.APP_NAME,
        clientId: uuid2clientId(randomUUID()),
        handleRedirect: redirectToIdp,
      })
    ).pipe(
      // TODO this should never be reached, however the static analysis requires it.
      map((r) => ({ body: {}, status: 500, headers: {} }))
    );
  }

  private handleRedirect(input: HttpHandlerContext): Observable<HttpHandlerResponse> {
    // @ts-ignore
    const session: CookieSessionObject = input.request.session;

    if (!session || !session["sessionId"]) {
      return of({ body: {}, status: 300, headers: { location: String(process.env.BASE_URL) } });
    }

    return from(this.handleRedirectPromise(session["sessionId"], input.request.url.pathname));
  }

  private async handleRedirectPromise(
    sessionId: string,
    url: string
  ): Promise<HttpHandlerResponse> {
    const oidcSession = await getSessionFromStorage(sessionId, this.sessionManager.storage);

    if (!oidcSession) {
      return { body: {}, status: 300, headers: { location: process.env.BASE_URL + "/login" } };
    }

    await oidcSession.handleIncomingRedirect(process.env.BASE_URL + "/auth" + url);

    if (oidcSession.info.isLoggedIn && oidcSession.info.webId) {
      await this.sessionManager.changeKey(sessionId, oidcSession.info.webId);
      // TODO what are the implications of not deleting the session object before redirecting
      // delete req.session["sessionId"]
      // req.session["webId"] = oidcSession.info.webId;
      // res.redirect(200, process.env.BASE_URL + "/dashboard");
      return { body: {}, status: 300, headers: { location: process.env.BASE_URL + "/dashboard" } };
    }

    // TODO unreachable point?
    return { body: {}, status: 500, headers: {} };
  }
}
