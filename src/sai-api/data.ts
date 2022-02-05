import {UniqueId, IRI } from "./misc";

export type DataRegistration = {
    registeredBy: IRI;
    registeredWith: IRI;
    registeredAt: Date;
    updatedAt: Date;
    shapeTree: IRI;
} & UniqueId;

export type DataRegistry = {
    registrations: DataRegistration[];
} & UniqueId;