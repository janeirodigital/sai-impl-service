export const RequestMessageTypes = {
  APPLICATIONS_REQUEST: '[APPLICATION PROFILES] Application Profiles Requested',
  SOCIAL_AGENTS_REQUEST: '[SOCIAL AGENTS] Application Profiles Requested',
  DESCRIPTIONS_REQUEST: '[DESCRIPTIONS] Descriptions Requested',
  DATA_REGISTRIES_REQUEST: '[DATA_REGISTRIES] Data Registries Requested',
  ADD_SOCIAL_AGENT_REQUEST: '[SOCIAL AGENTS] Data Registries Requested',
} as const

export const ResponseMessageTypes = {
  APPLICATIONS_RESPONSE: '[APPLICATION PROFILES] Application Profiles Received',
  SOCIAL_AGENTS_RESPONSE: '[SOCIAL AGENTS PROFILES] Application Profiles Received',
  DESCRIPTIONS_RESPONSE: '[DESCRIPTIONS] Descriptions Received',
  DATA_REGISTRIES_RESPONSE: '[DATA_REGISTRIES] Data Registries Received',
  SOCIAL_AGENT_RESPONSE: '[SOCIAL AGENTS] Social Agent Received'
} as const

type ResponseKeys = keyof typeof ResponseMessageTypes

export type ResponseMessage = ApplicationsResponseMessage | SocialAgentsResponseMessage |
  SocialAgentResponseMessage | DataRegistriesResponseMessage | DescriptionsResponseMessage

export type ApplicationsResponseMessage = {
  type: typeof ResponseMessageTypes.APPLICATIONS_RESPONSE,
  payload: Application[]
}

export type SocialAgentsResponseMessage = {
  type: typeof ResponseMessageTypes.SOCIAL_AGENTS_RESPONSE,
  payload: SocialAgent[]
}

export type SocialAgentResponseMessage = {
  type: typeof ResponseMessageTypes.SOCIAL_AGENT_RESPONSE,
  payload: SocialAgent
}

export type DataRegistriesResponseMessage = {
  type: typeof ResponseMessageTypes.DATA_REGISTRIES_RESPONSE,
  payload: DataRegistry[]
}

export type DescriptionsResponseMessage = {
  type: typeof ResponseMessageTypes.DESCRIPTIONS_RESPONSE,
  payload: Description[]
}

export type IRI = string;

abstract class MessageBase {
  stringify (): string {
    return JSON.stringify(this)
  }
}

export class ApplicationsRequest extends MessageBase {
  public type = RequestMessageTypes.APPLICATIONS_REQUEST
}

export class ApplicationsResponse {
  public type = ResponseMessageTypes.APPLICATIONS_RESPONSE
  public payload: Application[]

  constructor(message: ApplicationsResponseMessage) {
    if (message.type !== this.type) {
      throw new Error(`Invalid message type! Expected: ${this.type}, received: ${message.type}`)
    }
    this.payload = message.payload
  }
}

export class SocialAgentsRequest extends MessageBase {
  public type = RequestMessageTypes.SOCIAL_AGENTS_REQUEST
}

export class SocialAgentsResponse {
  public type = ResponseMessageTypes.SOCIAL_AGENTS_RESPONSE
  public payload: SocialAgent[]

  constructor(message: SocialAgentsResponseMessage) {
    if (message.type !== this.type) {
      throw new Error(`Invalid message type! Expected: ${this.type}, received: ${message.type}`)
    }
    this.payload = message.payload
  }
}

export class AddSocialAgentRequest extends MessageBase {
  public type = RequestMessageTypes.ADD_SOCIAL_AGENT_REQUEST

  constructor(public webId: IRI, public label: string, public note?: string) {
    super()
  }
}

export class SocialAgentResponse {
  public type = ResponseMessageTypes.SOCIAL_AGENT_RESPONSE
  public payload: SocialAgent

  constructor(message: SocialAgentResponseMessage) {
    if (message.type !== this.type) {
      throw new Error(`Invalid message type! Expected: ${this.type}, received: ${message.type}`)
    }
    this.payload = message.payload
  }
}

export class DataRegistriesRequest extends MessageBase {
  public type = RequestMessageTypes.DATA_REGISTRIES_REQUEST

  constructor(private lang: string) {
    super()
  }
}

export class DataRegistriesResponse {
  public type = ResponseMessageTypes.DATA_REGISTRIES_RESPONSE
  public payload: DataRegistry[]

  constructor(message: DataRegistriesResponseMessage) {
    if (message.type !== this.type) {
      throw new Error(`Invalid message type! Expected: ${this.type}, received: ${message.type}`)
    }
    this.payload = message.payload
  }
}

export class DescriptionsRequest extends MessageBase {
  public type = RequestMessageTypes.DESCRIPTIONS_REQUEST

  constructor(private applicationId: IRI, private lang: string) {
    super()
  }
}

export class DescriptionsResponse {
  public type = ResponseMessageTypes.DESCRIPTIONS_RESPONSE
  public payload: Description[]

  constructor(message: DescriptionsResponseMessage) {
    if (message.type !== this.type) {
      throw new Error(`Invalid message type! Expected: ${this.type}, received: ${message.type}`)
    }
    this.payload = message.payload
  }
}

export type Request = ApplicationsRequest | SocialAgentsRequest | AddSocialAgentRequest |
  DataRegistriesRequest | DescriptionsRequest

export interface UniqueId {
  id: IRI;
}

export interface Application extends UniqueId {
  name: string;
  description: string;
  author?: IRI;
  thumbnail?: IRI;
  authorizationDate: string; // interop:registeredAt
  lastUpdateDate?: string;    // interop:updatedAt
  accessNeedGroup: IRI    // interop:hasAccessNeedGroup
}

export interface SocialAgent extends UniqueId {
  label: string;
  note?: string;
  authorizationDate: string; // interop:registeredAt
  lastUpdateDate?: string;    // interop:updatedAt
}

export interface DataRegistration extends UniqueId {
  shapeTree: IRI;
  dataRegistry: IRI;
  count: number;
  label?: string; // TODO label should be ensured
}

export interface DataRegistry extends UniqueId {
  registrations: DataRegistration[]
}

export interface Description extends UniqueId {
  label: string;
  description?: string;
  needId: IRI;
};


export interface AccessNeedGroup extends UniqueId {
  title: string;
  description: string;
  required: boolean;
  needs: AccessNeed[],
}

export interface AccessNeed extends UniqueId {
  title: string;
  description: string;
  required: boolean;
  // IRIs for the access modes
  access: Array<IRI>;
}
