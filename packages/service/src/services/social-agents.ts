import { CRUDSocialAgentRegistration } from "@janeirodigital/interop-data-model";
import { getOneObject } from "../utils/rdf-parser";
import { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent";
import { SKOS, INTEROP } from "@janeirodigital/interop-namespaces";
import { SocialAgent } from "@janeirodigital/sai-api-messages";
import { DataFactory } from "n3";

const buildSocialAgentProfile = (
  registration: CRUDSocialAgentRegistration
): SocialAgent => {
  // TODO (elf-pavlik) move to sai-js
  // TODO (angel) get iris using something like Inrupt's prefix generator
  // TODO (angel) data validation and how to handle when the social agents profile is missing some components?
  const node = DataFactory.namedNode(registration.iri)
  const socialAgentNode = getOneObject(registration.dataset.match(node, INTEROP.registeredAgent, null))!
  const id = socialAgentNode.value;
  const label = getOneObject(registration.dataset.match(node, SKOS.prefLabel))!.value;
  const note = getOneObject(registration.dataset.match(node, SKOS.note))?.value;
  const registeredAt = registration.registeredAt!;
  const updatedAt = registration.updatedAt;

  return {
    id,
    label,
    note,
    authorizationDate: registeredAt.toISOString(),
    lastUpdateDate: updatedAt?.toISOString()
  };
};

export const getSocialAgents = async (agent: AuthorizationAgent) => {
  const profiles: SocialAgent[] = [];
  for await (const registration of agent.socialAgentRegistrations) {
      profiles.push(buildSocialAgentProfile(registration));
  }
  return profiles;
};
