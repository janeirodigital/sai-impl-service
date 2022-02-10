import { AuthorizationAgent } from "@janeirodigital/authorization-agent";
import { INTEROP } from "@janeirodigital/interop-namespaces";
import { ReadableAccessConsent } from "@janeirodigital/interop-data-model";

export const getAccessConsents = async (agent: AuthorizationAgent, applicationId: string) => {
  const consents = [];
  for await (const consent of agent.accessConsents) {
    if (consent.grantee !== applicationId) continue;

    const id = consent.iri;
    const grantedAt = consent.getObject(INTEROP.grantedAt)?.value;
    const updatedAt = consent.getObject(INTEROP.updatedAt)?.value;
    const needGroup = consent.getObject(INTEROP.hasAccessNeedGroup)?.value;
    const dataConsents = await buildDataConsents(consent);
    consents.push({ id, grantedAt, updatedAt, needGroup, dataConsents });
  }
  return consents;
};

const buildDataConsents = async (consent: ReadableAccessConsent) => {
  const dataConsents = [];
  for await (const dataConsent of consent.dataConsents) {
    const id = dataConsent.iri;
    const accessNeed = dataConsent.getObject(INTEROP.satisfiesAccessNeed)?.value;
    const scope = dataConsent.scopeOfConsent;
    dataConsents.push({ id, scope, accessNeed });
  }

  return dataConsents;
};
