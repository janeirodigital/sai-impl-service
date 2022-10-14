import type { CRUDApplicationRegistration } from "@janeirodigital/interop-data-model";
import type { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent";
import type { Application } from "@janeirodigital/sai-api-messages";

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
