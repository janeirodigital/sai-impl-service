import { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent";

type SessionId = string;

const storage = new Map<SessionId, AuthorizationAgent>();

export default storage;
