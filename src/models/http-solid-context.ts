import { HttpHandlerContext } from "@digita-ai/handlersjs-http";
import { Session } from "@inrupt/solid-client-authn-node";
import { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent";

export interface HttpSolidContext extends HttpHandlerContext {
  webId?: string;
  sessionId?: string;
  oidcSession?: Session;
  saiSession?: AuthorizationAgent;
  authn?: {
    webId: string;
    clientId?: string;
  }
}
