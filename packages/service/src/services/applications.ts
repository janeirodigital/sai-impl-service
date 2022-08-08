import { CRUDApplicationRegistration } from "@janeirodigital/interop-data-model";
import { getOneObject, getOneSubject } from "../utils/rdf-parser";
import { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent";
import { DatasetCore } from "@rdfjs/types";
import { INTEROP, RDF } from "@janeirodigital/interop-namespaces";

const buildApplicationProfile = (
  profile: DatasetCore,
  registration: CRUDApplicationRegistration
) => {
  // TODO (angel) get iris using something like Inrupt's prefix generator
  // TODO (angel) data validation and how to handle when the applications profile is missing some components?
  const id = getOneSubject(profile.match(null, RDF.type, INTEROP.Application))?.value;
  const name = getOneObject(profile.match(null, INTEROP.applicationName))?.value;
  const description = getOneObject(profile.match(null, INTEROP.applicationDescription))?.value;
  const author = getOneObject(profile.match(null, INTEROP.applicationAuthor))?.value;
  const thumbnail = getOneObject(profile.match(null, INTEROP.applicationThumbnail))?.value;
  const registeredAt = registration.registeredAt;
  const updatedAt = registration.updatedAt;
  const accessNeedGroup = getOneObject(profile.match(null, INTEROP.hasAccessNeedGroup))?.value;

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
    // TODO (angel) what to do when the `.data` property is incomplete?
    if (registration.registeredAgent) {
      // const profile = await agent
      //   .fetch(registration.registeredAgent)
      //   .then((response) => response.dataset());

      // const applicationProfile = buildApplicationProfile(profile, registration);
      // profiles.push(applicationProfile);
      profiles.push({ id: registration.iri});
    }
  }
  return profiles;
};
