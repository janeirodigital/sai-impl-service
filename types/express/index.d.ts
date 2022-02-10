import {AuthorizationAgent} from '@janeirodigital/authorization-agent';

declare global {
    namespace Express {
        export interface Request {
            sai: AuthorizationAgent;
            webId: string;
        }
    }
}
