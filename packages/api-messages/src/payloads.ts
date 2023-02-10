import { IRI, UniqueId } from './index';

export type Payloads =  Application[]
                      | SocialAgent[]
                      | SocialAgent
                      | DataRegistry[]
                      | AuthorizationData
                      | AccessAuthorization
                      | Partial <Application>
export interface Application extends UniqueId {
  name: string;
  logo?: IRI;
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
  label: string;
  description?: string;
  required?: boolean;
  needs: AccessNeed[];
}

export interface AccessNeed extends UniqueId {
  label: string;
  description?: string;
  required?: boolean;
  // IRIs for the access modes
  access: Array<IRI>;
  shapeTree: {
    id: IRI,
    label: string
  }
  children?: AccessNeed[]
  parent?: IRI
}

export interface AuthorizationData extends UniqueId {
  accessNeedGroup: AccessNeedGroup
}

export interface DataAuthorization {
  accessNeed: IRI,
  scope: string,
  dataOwner?: IRI,
  dataRegistration?: IRI,
  dataInstances?: IRI[]
}

export interface BaseAuthorization {
  grantee: IRI;
  accessNeedGroup: IRI;
}
export interface GrantedAuthorization extends BaseAuthorization {
  dataAuthorizations: DataAuthorization[]
  granted: true;
}

export interface DeniedAuthorization extends BaseAuthorization {
  granted: false
  dataAuthorizations?: never;
}

export type Authorization = GrantedAuthorization | DeniedAuthorization

export interface AccessAuthorization extends UniqueId, GrantedAuthorization {
  callbackEndpoint?: IRI;
}
