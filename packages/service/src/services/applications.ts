import { CRUDApplicationRegistration } from "@janeirodigital/interop-data-model";
import { getOneObject } from "../utils/rdf-parser";
import { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent";
import { INTEROP, OIDC } from "@janeirodigital/interop-namespaces";
import { Application } from "@janeirodigital/sai-api-messages";
import { DataFactory } from "n3";

const buildApplicationProfile = (
  registration: CRUDApplicationRegistration
): Application => {
  // TODO (elf-pavlik) move to sai-js
  // TODO (angel) get iris using something like Inrupt's prefix generator
  // TODO (angel) data validation and how to handle when the applications profile is missing some components?
  const node = DataFactory.namedNode(registration.iri)
  const applicationNode = getOneObject(registration.dataset.match(node, INTEROP.registeredAgent, null))!
  const id = applicationNode.value;
  const name = getOneObject(registration.dataset.match(applicationNode, OIDC.client_name))!.value;
  const logo = getOneObject(registration.dataset.match(applicationNode, OIDC.logo_uri))?.value;
  const registeredAt = registration.registeredAt!;
  const updatedAt = registration.updatedAt;
  const accessNeedGroup = getOneObject(registration.dataset.match(applicationNode, INTEROP.hasAccessNeedGroup))!.value;

  return {
    id,
    name,
    logo,
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
