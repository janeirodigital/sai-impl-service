import { Store, DataFactory } from "n3";
//import { subscribe } from "solid-webhook-client";
import { CRUDSocialAgentRegistration } from "@janeirodigital/interop-data-model";
import { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent";
import { SKOS, INTEROP } from "@janeirodigital/interop-namespaces";
import { IRI, SocialAgent } from "@janeirodigital/sai-api-messages";
import { getLoggerFor } from '@digita-ai/handlersjs-logging';
import { getOneObject } from "../utils/rdf-parser";
//import { webhookTargetUri } from "../url-templates";

const logger = getLoggerFor('social-agent', 5, 5);

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

export const addSocialAgent = async (agent: AuthorizationAgent, data: { webId: IRI, label: string, note?: string}): Promise<SocialAgent> => {
  const existing = await agent.findSocialAgentRegistration(data.webId)
  if (existing) {
    logger.error('SocialAgentRegistration already exists', { webId: data.webId })
    return buildSocialAgentProfile(existing)
  }
  const registration = await agent.registrySet.hasAgentRegistry.addSocialAgentRegistration(data.webId, data.label, data.note)
 /*
  * TODO(elf-pavlik): move to background job
  * subscribes to the notifications for the discovered registration
  */

  const reciprocalRegistrationIri = await registration.discoverReciprocal(agent.rawFetch)
  if (reciprocalRegistrationIri) {
    const quad = DataFactory.quad(
      DataFactory.namedNode(registration.iri),
      INTEROP.reciprocalRegistration,
      DataFactory.namedNode(reciprocalRegistrationIri)
    )
    await registration.addPatch(new Store([quad]))

    // try {
    //   // TODO(elf-pavlik): store subsciption details in store including expected sender's WebID
    //   const subsciption = subscribe(
    //     reciprocalRegistrationIri,
    //     webhookTargetUri(agent.webId, data.webId),
    //     { fetch: agent.rawFetch }
    //   )
    // } catch (e) {
    //   logger.error('subscription failed')
    // }
  }
  return buildSocialAgentProfile(registration)
}
