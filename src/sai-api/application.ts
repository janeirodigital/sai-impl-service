import {IRI, UniqueId} from "./misc";


export type ApplicationProfile = {
    name: string;
    description: string;
    author: string;
    thumbnail: string;
} & UniqueId;

export type ApplicationRegistration = {
    registeredBy: IRI;
    registeredWith: IRI;
    registeredAt: Date;
    updatedAt: Date;
    registeredAgent: IRI;
    accessGrant: IRI;
} & UniqueId;