export const MessageTypes = {
  APPLICATIONS_REQUEST: '[APPLICATION PROFILES] Application Profiles Requested',
  APPLICATIONS_RESPONSE: '[APPLICATION PROFILES] Application Profiles Received',
  DESCRIPTION_REQUESTED: '[DESCRIPTIONS] Description Requested'
} as const

type Keys = keyof typeof MessageTypes

// type Message = {
//   type:  typeof MessageTypes[Keys];
//   payload?:
// }

export type Message = ApplicationsRequest | ApplicationsResponse

export class ApplicationsRequest {
  public type = MessageTypes.APPLICATIONS_REQUEST
}

export class ApplicationsResponse {
  public type = MessageTypes.APPLICATIONS_RESPONSE
  public payload: Application[]

  constructor(message: Message) {
    if (message.type !== this.type) {
      throw new Error(`Invalid message type! Expected: ${this}, received: ${message.type}`)
    }
    this.payload = message.payload
  }
}

export interface UniqueId {
  id: string;
};

export interface Application extends UniqueId {
  name: string;
  description: string;
  author?: string;
  thumbnail?: string;
  authorizationDate: string; // interop:registeredAt
  lastUpdateDate?: string;    // interop:updatedAt
  accessNeedGroup: string    // interop:hasAccessNeedGroup
}

export interface Description extends UniqueId {
  label: string;
  description?: string;
  needId: string;
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
  // TODO (angel) type the array
  access: Array<string>;
}
