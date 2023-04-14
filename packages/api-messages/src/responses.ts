import { AccessAuthorization, Application, AuthorizationData, DataRegistry, Payloads, SocialAgent } from './payloads';

export const ResponseMessageTypes = {
  APPLICATIONS_RESPONSE: '[APPLICATION PROFILES] Application Profiles Received',
  SOCIAL_AGENTS_RESPONSE: '[SOCIAL AGENTS PROFILES] Application Profiles Received',
  DESCRIPTIONS_RESPONSE: '[DESCRIPTIONS] Descriptions Received',
  DATA_REGISTRIES_RESPONSE: '[DATA_REGISTRIES] Data Registries Received',
  SOCIAL_AGENT_RESPONSE: '[SOCIAL AGENTS] Social Agent Received',
  APPLICATION_AUTHORIZATION_REGISTERED: '[APPLICATION] Authorization registered',
  UNREGISTERED_APPLICATION_PROFILE: 'ApplicationProfileResponse',
} as const

export type TResponseMessage = typeof ResponseMessageTypes
export type TResponseMessages = keyof TResponseMessage;
export type VResponseMessages = TResponseMessage[TResponseMessages]

export type IResponseMessage<T extends VResponseMessages, P extends Payloads> = {
  type: T,
  payload: P
}

export type ApplicationsResponseMessage = IResponseMessage<typeof ResponseMessageTypes.APPLICATIONS_RESPONSE, Application[]>;
export type SocialAgentsResponseMessage = IResponseMessage<typeof ResponseMessageTypes.SOCIAL_AGENTS_RESPONSE, SocialAgent[]>;
export type SocialAgentResponseMessage = IResponseMessage<typeof ResponseMessageTypes.SOCIAL_AGENT_RESPONSE, SocialAgent>;
export type DataRegistriesResponseMessage = IResponseMessage<typeof ResponseMessageTypes.DATA_REGISTRIES_RESPONSE, DataRegistry[]>;
export type DescriptionsResponseMessage = IResponseMessage<typeof ResponseMessageTypes.DESCRIPTIONS_RESPONSE, AuthorizationData>;
export type ApplicationAuthorizationResponseMessage = IResponseMessage<typeof ResponseMessageTypes.APPLICATION_AUTHORIZATION_REGISTERED, AccessAuthorization>;
export type UnregisteredApplicationResponseMessage = IResponseMessage<typeof ResponseMessageTypes.UNREGISTERED_APPLICATION_PROFILE, Partial<Application>>

export type ResponseMessage = ApplicationsResponseMessage | SocialAgentsResponseMessage |
  SocialAgentResponseMessage | DataRegistriesResponseMessage | DescriptionsResponseMessage |
  ApplicationAuthorizationResponseMessage | UnregisteredApplicationResponseMessage

function validateType(messageType: VResponseMessages, requiredType: VResponseMessages) {
  if (messageType !== requiredType) {
    throw new Error(`Invalid message type! Expected: ${messageType}, received: ${requiredType}`)
  }
}

export class ApplicationsResponse {
  public type = ResponseMessageTypes.APPLICATIONS_RESPONSE
  public payload: Application[]

  constructor(message: ApplicationsResponseMessage) {
    validateType(message.type, this.type);
    this.payload = message.payload
  }
}

export class UnregisteredApplicationProfileResponse {
  public type = ResponseMessageTypes.UNREGISTERED_APPLICATION_PROFILE
  public payload: Partial<Application>
  constructor(message: UnregisteredApplicationResponseMessage) {
    validateType(message.type, this.type)
    this.payload = message.payload;
  }
}

export class SocialAgentsResponse {
  public type = ResponseMessageTypes.SOCIAL_AGENTS_RESPONSE
  public payload: SocialAgent[]

  constructor(message: SocialAgentsResponseMessage) {
    validateType(message.type, this.type);
    this.payload = message.payload
  }
}

export class SocialAgentResponse {
  public type = ResponseMessageTypes.SOCIAL_AGENT_RESPONSE
  public payload: SocialAgent

  constructor(message: SocialAgentResponseMessage) {
    validateType(message.type, this.type);
    this.payload = message.payload
  }
}

export class DataRegistriesResponse {
  public type = ResponseMessageTypes.DATA_REGISTRIES_RESPONSE
  public payload: DataRegistry[]

  constructor(message: DataRegistriesResponseMessage) {
    validateType(message.type, this.type);
    this.payload = message.payload
  }
}

export class DescriptionsResponse {
  public type = ResponseMessageTypes.DESCRIPTIONS_RESPONSE
  public payload: AuthorizationData

  constructor(message: DescriptionsResponseMessage) {
    validateType(message.type, this.type);
    this.payload = message.payload
  }
}

export class ApplicationAuthorizationResponse {

  public type = ResponseMessageTypes.APPLICATION_AUTHORIZATION_REGISTERED
  public payload: AccessAuthorization

  constructor(message: ApplicationAuthorizationResponseMessage) {
    validateType(message.type, this.type);
    this.payload = message.payload
  }
}