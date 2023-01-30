import type { CRUDApplicationRegistration } from "@janeirodigital/interop-data-model";
import type { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent";
import type { Application, IRI } from '@janeirodigital/sai-api-messages';

const buildApplicationProfile = (
  registration: CRUDApplicationRegistration
): Application => {
  // TODO (angel) data validation and how to handle when the applications profile is missing some components?
  return {
    id: registration.registeredAgent,
    name: registration.name!,
    logo: registration.logo,
    authorizationDate: registration.registeredAt!.toISOString(),
    lastUpdateDate: registration.updatedAt?.toISOString(),
    accessNeedGroup: registration.accessNeedGroup!,
  };
};

export const getApplications = async (saiSession: AuthorizationAgent) => {
  const profiles: Application[] = [];
  for await (const registration of saiSession.applicationRegistrations) {
      profiles.push(buildApplicationProfile(registration));
  }
  return profiles;
};

export const getUnregisteredApplicationProfile = async (agent: AuthorizationAgent, id: IRI): Promise<Partial<Application>> => {
  const {name, logo, accessNeedGroup } = await agent.factory.readable.clientIdDocument(id).then(doc => (
    { name: doc.clientName, logo: doc.logoUri, accessNeedGroup: doc.hasAccessNeedGroup }
  ));

  return { name, logo, accessNeedGroup };
}
