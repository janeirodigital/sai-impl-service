import {IRI, UniqueId} from "./misc";
import {ACL} from "./acl";
import {ConsentScope} from "./consent";

export type AccessGrant = {
    grantedBy: IRI;
    grantedAt: Date;
    grantee: IRI;
    accessNeedGroup: IRI;
    dataGrants: [IRI];
} & UniqueId;

export type DataGrant = {
    dataOwner: IRI;
    grantee: IRI;
    shapeTree: IRI;
    dataRegistration: IRI;
    dataResources: IRI;
    accessModes: [ACL];
    creatorAccessMode: [ACL];
    scope: ConsentScope;
    satisfiesAccessNeed: IRI;
    dataInstance: IRI;
    inheritsFrom: IRI;
} & UniqueId;

export type DelegatedDataGrant = {
    delegationOf: IRI;
} & DataGrant;