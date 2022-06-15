import {AuthorizationAgent} from '@janeirodigital/interop-authorization-agent';

declare global {
    namespace Express {
        export interface Request {
            sai: AuthorizationAgent;
        }
    }
}
