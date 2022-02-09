import {IRI, UniqueId} from './misc';
import {ACL} from "./acl";

export type ConsentScope =
    | 'http://www.w3.org/ns/solid/interop#All'
    | 'http://www.w3.org/ns/solid/interop#AllFromAgent'
    | 'http://www.w3.org/ns/solid/interop#AllFromRegistry'
    | 'http://www.w3.org/ns/solid/interop#SelectedFromRegistry'
    | 'http://www.w3.org/ns/solid/interop#Inherited';

export type AccessConsent = {
    grantedBy: IRI;
    grantedWith?: IRI;
    grantedAt: Date;
    grantee: IRI;
    accessNeedGroup?: IRI;
    dataConsent: IRI[];
    replaces?: IRI
} & UniqueId;

export type DataConsent = {
    dataOwner?: IRI;
    grantee: IRI;
    shapeTree: IRI;
    accessModes: ACL[],
    creatorAccessModes?: ACL[],
    scope: ConsentScope,
    dataRegistration?: IRI;
    dataInstance: IRI[];
    // TODO (angel) check whether this property still exists
    dataResource?: IRI;
    satisfiesAccessNeed?: IRI;
    inheritsFrom?: IRI;
} & UniqueId;