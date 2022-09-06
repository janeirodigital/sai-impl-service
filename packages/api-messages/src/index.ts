export const RequestMessageTypes = {
  APPLICATIONS_REQUEST: '[APPLICATION PROFILES] Application Profiles Requested',
  DESCRIPTIONS_REQUEST: '[DESCRIPTIONS] Descriptions Requested',
} as const

export const ResponseMessageTypes = {
  APPLICATIONS_RESPONSE: '[APPLICATION PROFILES] Application Profiles Received',
  DESCRIPTIONS_RESPONSE: '[DESCRIPTIONS] Descriptions Received'
} as const

type ResponseKeys = keyof typeof ResponseMessageTypes

export type ResponseMessage = ApplicationsResponseMessage | DescriptionsResponseMessage

export type ApplicationsResponseMessage = {
  type: typeof ResponseMessageTypes.APPLICATIONS_RESPONSE,
  payload: Application[]
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

export type Request = ApplicationsRequest | DescriptionsRequest

export interface UniqueId {
  id: IRI;
};

export interface Application extends UniqueId {
  name: string;
  description: string;
  author?: IRI;
  thumbnail?: IRI;
  authorizationDate: string; // interop:registeredAt
  lastUpdateDate?: string;    // interop:updatedAt
  accessNeedGroup: IRI    // interop:hasAccessNeedGroup
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
