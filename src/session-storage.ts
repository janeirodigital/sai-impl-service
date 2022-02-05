import {AuthorizationAgent} from '@janeirodigital/authorization-agent';

type SessionId = string;

const storage = new Map<SessionId, AuthorizationAgent>();

export default storage;