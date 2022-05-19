import { from, Observable } from "rxjs";
import { createSolidTokenVerifier, RequestMethod, SolidAccessTokenPayload } from "@solid/access-token-verifier";
import { HttpSolidContext } from "../models/http-solid-context";
import { baseUrl } from "../url-templates"
import { MiddlewareHttpHandler } from "./middleware-http-handler";

/**
 * Uses  access-token-verifier and sets authn on the context if token was provided
 * context.autn {
 *   webId: string
 *   clientId: string
 * }
 */
export class AuthnMiddleware implements MiddlewareHttpHandler {

  handle(context: HttpSolidContext): Observable<HttpSolidContext> {
    return from(this.handleAsync(context))
  }

  async handleAsync(context: HttpSolidContext): Promise<HttpSolidContext> {
    const { headers: { Authorization: authorization, DPoP: dpop }, method } = context.request;
    if (!authorization && !dpop) {
      return context
    }

    if (!authorization || !dpop) {
      throw { headers: {}, status: 400 }
    }

    const verifier = createSolidTokenVerifier()
    let token: SolidAccessTokenPayload
    try {
      token = await verifier(
        authorization,
        {
          header: dpop as string,
          method: method as RequestMethod,
          url: `${baseUrl}${context.request.url}`,
        }
      );
      return {
        ...context,
        authn: {
          webId: token.webid,
          clientId: token.client_id
        }
      }
    } catch (error: unknown) {
      // TODO: add logging
      // const message = `Error verifying WebID via DPoP-bound access token: ${(error as Error).message}`;
      throw { status: 401, headers: {} }
    }
  }
}
