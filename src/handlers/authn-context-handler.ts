import { from, Observable } from "rxjs";
import { createSolidTokenVerifier, RequestMethod, SolidAccessTokenPayload } from "@solid/access-token-verifier";
import { AuthnContext } from "../models/http-solid-context";
import { HttpContextHandler } from "./middleware-http-handler";
import { HttpHandlerContext } from "@digita-ai/handlersjs-http";

/**
 * Uses  access-token-verifier and sets authn on the context if token was provided,
 * throws a 400 response if the token is not provided or fails verification.
 *
 * context.authn {
 *   webId: string
 *   clientId: string
 * }
 */
export class AuthnContextHandler implements HttpContextHandler {

  handle(context: HttpHandlerContext): Observable<AuthnContext> {
    return from(this.handleAsync(context))
  }

  async handleAsync(context: HttpHandlerContext): Promise<AuthnContext> {
    // TODO check for alternative casing on the header names
    const { headers: { authorization, dpop }, method } = context.request;

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
          url: context.request.url.toString(),
        }
      );
      return {
        ...context,
        authn: {
          webId: token.webid,
          clientId: token.client_id,
        }
      }
    } catch (error: unknown) {
      // TODO: add logging
      // const message = `Error verifying WebID via DPoP-bound access token: ${(error as Error).message}`;
      throw { status: 401, headers: {} }
    }
  }
}