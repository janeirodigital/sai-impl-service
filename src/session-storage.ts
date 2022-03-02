import { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent";

type WebId = string;

const storage = new Map<WebId, AuthorizationAgent>();

export default storage;
