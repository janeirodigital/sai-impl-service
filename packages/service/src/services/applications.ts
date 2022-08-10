import { CRUDApplicationRegistration } from "@janeirodigital/interop-data-model";
import { getOneObject } from "../utils/rdf-parser";
import { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent";
import { INTEROP } from "@janeirodigital/interop-namespaces";

const buildApplicationProfile = (
  registration: CRUDApplicationRegistration
) => {
  // TODO (angel) get iris using something like Inrupt's prefix generator
  // TODO (angel) data validation and how to handle when the applications profile is missing some components?
  const applicationNode = getOneObject(registration.dataset.match(null, INTEROP.registeredAgent, null))
  const id = applicationNode?.value;
  const name = getOneObject(registration.dataset.match(applicationNode, INTEROP.applicationName))?.value;
  const description = getOneObject(registration.dataset.match(applicationNode, INTEROP.applicationDescription))?.value;
  const author = getOneObject(registration.dataset.match(null, INTEROP.applicationAuthor))?.value;
  const thumbnail = getOneObject(registration.dataset.match(null, INTEROP.applicationThumbnail))?.value;
  const registeredAt = registration.registeredAt;
  const updatedAt = registration.updatedAt;
  const accessNeedGroup = getOneObject(registration.dataset.match(null, INTEROP.hasAccessNeedGroup))?.value;

  return {
    id,
    name,
    description,
    author,
    thumbnail,
    registeredAt,
    updatedAt,
    accessNeedGroup,
  };
};

export const getApplications = async (agent: AuthorizationAgent) => {
  const registrations: CRUDApplicationRegistration[] = [];
  for await (const registration of agent.applicationRegistrations) {
    registrations.push(registration);
  }

  const profiles = [] as any[];
  for (const registration of registrations) {
    if (registration.registeredAgent) {
      const applicationProfile = buildApplicationProfile(registration);
      profiles.push(applicationProfile);
    }
  }
  return profiles;
};
