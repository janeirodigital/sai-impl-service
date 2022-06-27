import { HttpHandlerContext } from "@digita-ai/handlersjs-http";
import { Session } from "@inrupt/solid-client-authn-node";
import { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent";

export interface SaiContext extends HttpHandlerContext {
  saiSession: AuthorizationAgent;
}


export interface UnauthenticatedAuthnContext extends HttpHandlerContext {
  authn: {
    authenticated: false;
  }
}
export interface AuthenticatedAuthnContext extends HttpHandlerContext {
  authn: {
    authenticated: true;
    webId: string;
    clientId: string;
  }
}

export type AuthnContext = UnauthenticatedAuthnContext | AuthenticatedAuthnContext

export type HttpSolidContext =  SaiContext & AuthnContext;
