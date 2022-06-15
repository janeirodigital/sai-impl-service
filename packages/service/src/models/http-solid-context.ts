import { HttpHandlerContext } from "@digita-ai/handlersjs-http";
import { Session } from "@inrupt/solid-client-authn-node";
import { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent";

export interface OidcContext extends HttpHandlerContext {
  oidcSession: Session;
}

export interface SaiContext extends HttpHandlerContext {
  saiSession: AuthorizationAgent;
}

export interface AuthnContext extends HttpHandlerContext {
  authn: {
    webId: string;
    clientId?: string;
  }
}

export type  HttpSolidContext = OidcContext & SaiContext & AuthnContext;

