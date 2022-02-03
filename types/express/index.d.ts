import {AuthorizationAgent} from '@janeirodigital/authorization-agent';
import {Session} from '@inrupt/solid-client-authn-node';

declare global {
    namespace Express {
        export interface Request {
            webId?: string;
            sessionId?: string,
            solidSession?: Session;
            saiSession?: AuthorizationAgent;
        }
    }
}