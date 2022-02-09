import {IRI, UniqueId} from "./misc";


export type ApplicationProfile = {
    name: string;
    description: string;
    author: string;
    thumbnail: string;
    // TODO (angel) match with the frontend
    registeredAt: string,
    updatedAt: string,
    accessNeedGroup: string;
} & UniqueId;
