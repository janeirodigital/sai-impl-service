import { HttpContextHandler } from "./middleware-http-handler";
import { AuthnContext, SaiContext } from "../models/http-solid-context";
import { SessionManager } from "../session-manager";
import { from, Observable } from "rxjs";

/**
 * Attaches the corresponding AuthorizationAgent to the context
 */
export class AuthorizationAgentContextHandler implements HttpContextHandler {
  constructor(private manager: SessionManager) {}

  handle(ctx: AuthnContext): Observable<SaiContext> {
    return from(this.handleAsync(ctx));
  }


  private async handleAsync(ctx: AuthnContext): Promise<SaiContext> {
    if (!ctx.authn?.webId) {
      throw new Error("Authentication not provided");
    }

    const saiSession = await this.manager.getSaiSession(ctx.authn.webId);

    if (!saiSession) {
      throw new Error("Error creating an AuthorizationAgent session");
    }

    return {...ctx, saiSession };
  }
}
