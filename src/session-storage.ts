import {Session} from '@inrupt/solid-client-authn-node';
import {AuthorizationAgent} from '@janeirodigital/authorization-agent';

type SessionInstance = {
    solidSession: Session,
    saiSession: AuthorizationAgent,
};

const storage = new Map<string, SessionInstance>();

export default storage;