import { CRUDApplicationRegistration } from "@janeirodigital/interop-data-model";
import { getOneObject } from "../utils/rdf-parser";
import { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent";
import { INTEROP } from "@janeirodigital/interop-namespaces";
import { Application } from "@janeirodigital/sai-api-messages";
import { DataFactory } from "n3";

const buildApplicationProfile = (
  registration: CRUDApplicationRegistration
): Application => {
  // TODO (elf-pavlik) move to sai-js
  // TODO (angel) get iris using something like Inrupt's prefix generator
  // TODO (angel) data validation and how to handle when the applications profile is missing some components?
  const node = DataFactory.namedNode(registration.iri)
  const applicationNode = getOneObject(registration.dataset.match(null, INTEROP.registeredAgent, null))!
  const id = applicationNode.value;
  const name = getOneObject(registration.dataset.match(applicationNode, INTEROP.applicationName))!.value;
  const description = getOneObject(registration.dataset.match(applicationNode, INTEROP.applicationDescription))!.value;
  const author = getOneObject(registration.dataset.match(node, INTEROP.applicationAuthor))?.value;
  const thumbnail = getOneObject(registration.dataset.match(node, INTEROP.applicationThumbnail))?.value;
  const registeredAt = registration.registeredAt!;
  const updatedAt = registration.updatedAt;
  const accessNeedGroup = getOneObject(registration.dataset.match(applicationNode, INTEROP.hasAccessNeedGroup))!.value;

  return {
    id,
    name,
    description,
    author,
    thumbnail,
    authorizationDate: registeredAt.toISOString(),
    lastUpdateDate: updatedAt?.toISOString(),
    accessNeedGroup,
  };
};

export const getApplications = async (agent: AuthorizationAgent) => {
  const profiles: Application[] = [];
  for await (const registration of agent.applicationRegistrations) {
      profiles.push(buildApplicationProfile(registration));
  }
  return profiles;
};
