import {IRI, UniqueId} from './misc';
import {ACL} from "./acl";

export enum ConsentScope {
    ALL = 'all',
    ALL_FROM_AGENT = 'all-from-agent',
    ALL_FROM_REGISTRY = 'all-from-registry',
    SELECTED = 'selected',
    INHERITED = 'inherited',
}

export type AccessConsent = {
    grantedBy: IRI;
    grantedWith: IRI;
    grantedAt: Date;
    grantee: IRI;
    accessNeedGroup: IRI;
    dataConsent: IRI;
    replaces?: IRI
} & UniqueId;

export type DataConsent = {
    dataOwner: IRI;
    grantee: IRI;
    shapeTree: IRI;
    AccessModes: [ACL],
    creatorAccessModes: [ACL],
    scope: ConsentScope,
    dataRegistration: IRI;
    dataInstance: IRI;
    dataResource: IRI;
    satisfiesAccessNeed?: IRI;
    inheritsFrom?: IRI;
} & UniqueId;