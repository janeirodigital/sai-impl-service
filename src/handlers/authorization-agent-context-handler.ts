import { HttpContextHandler } from "./middleware-http-handler";
import { AuthnContext, SaiContext } from "../models/http-solid-context";
import { SessionManager } from "../session-manager";
import { from, Observable } from "rxjs";
import { InternalServerError, UnauthorizedHttpError } from "@digita-ai/handlersjs-http";

/**
 * Attaches the corresponding AuthorizationAgent to the context
 */
export class AuthorizationAgentContextHandler implements HttpContextHandler {
  constructor(private manager: SessionManager) {}

  handle(ctx: AuthnContext): Observable<SaiContext> {
    return from(this.handleAsync(ctx));
  }


  private async handleAsync(ctx: AuthnContext): Promise<SaiContext> {
    if (!ctx.authn.webId) {
      throw new UnauthorizedHttpError();
    }

    const saiSession = await this.manager.getSaiSession(ctx.authn.webId);

    if (!saiSession) {
      throw new InternalServerError();
    }

    return {...ctx, saiSession };
  }
}
