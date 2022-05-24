import { HttpContextHandler } from "./middleware-http-handler";
import { AuthnContext, OidcContext } from "../models/http-solid-context";
import { SessionManager } from "../session-manager";
import { from, Observable } from "rxjs";
import { Session } from "@inrupt/solid-client-authn-node";

/**
 * Looks for a corresponding OIDC session on the server. Depending on the value
 * of `strict` it'll throw or not.
 */
export class OidcSessionContextHandler implements HttpContextHandler {
  constructor(
     private manager: SessionManager,
     private strict: boolean = true,
     ) {}

  handle(ctx: AuthnContext): Observable<OidcContext> {
    return from(this.handleAsync(ctx));
  }


  private async handleAsync(ctx: AuthnContext): Promise<OidcContext> {
    const oidcSession = await this.manager.getOidcSession(ctx.authn.webId);

    if (!oidcSession && !this.strict) {
      const fake = oidcSession as unknown as Session;
      return { ...ctx, oidcSession: fake };
    }

    if (!oidcSession) {
      throw { headers: {}, status: 400 }
    }

    return {...ctx, oidcSession };
  }
}
