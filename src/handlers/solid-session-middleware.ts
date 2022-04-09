import { MiddlewareHttpHandler } from "./middleware-http-handler";
import { HttpSolidContext } from "../models/http-solid-context";
import { SessionManager } from "../sai-session-storage";
import { from, map, Observable, of } from "rxjs";

/**
 * Attaches the corresponding OIDC session and the SAI session to the context
 */
export class SolidSessionMiddleware implements MiddlewareHttpHandler {
  constructor(private manager: SessionManager) {}

  handle(context: HttpSolidContext): Observable<HttpSolidContext> {
    if (!context.webId || !context.sessionId) return of(context);

    const saiSession$ = from(this.manager.get(context.webId));

    return saiSession$.pipe(map((saiSession) => ({ saiSession, ...context })));
  }
}
