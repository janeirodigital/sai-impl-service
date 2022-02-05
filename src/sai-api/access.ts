import {IRI, UniqueId} from "./misc";
import {ACL} from "./acl";

export enum AccessNecessity {
    REQUIRED = 'required',
    OPTIONAL =  'optional',
};

export enum AccessScenario {
    PERSONAL = 'personal',
    SHARED = 'shared',
};

export enum AuthenticationRole {
    SOCIAL = 'social',
    APPLICATION = 'application',
};

export type Access = {
    shapeTree: IRI;
    accessModes: ACL[];
    accessNecessity: AccessNecessity;
    dataInstance: IRI[];
    inheritsFrom?: IRI;
} & UniqueId;

export type AccessNeedGroup = {
    accessDescriptionSet: IRI[];
    accessNecessity: AccessNecessity;
    accessScenario: AccessScenario[];
    authenticatesAs: AuthenticationRole;
    accessNeeds: IRI[];
} & UniqueId;

export type AccessNeedGroupDescription = {
    descriptionSet: IRI;
    accessNeedGroup: IRI;
    preferredLabel: string;
    definition: string;
} & UniqueId;

export type AccessNeedDescription = {
    descriptionSet: IRI;
    accessNeedGroup: IRI;
    preferredLabel: string;
} & UniqueId;

export type AccessDescriptionSet = {
    // TODO (angel) is there a type for lang code, e.g.: 'en-US', 'es-AR', etc.
    language: string;
} & UniqueId;

export type AccessRequest = {
    from: IRI;
    to: IRI;
    accessNeedGroups: IRI[];
}