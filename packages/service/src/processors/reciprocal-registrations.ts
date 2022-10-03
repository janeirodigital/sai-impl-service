import { Store, DataFactory } from "n3";
import { subscribe } from "solid-webhook-client";
import { getLoggerFor } from '@digita-ai/handlersjs-logging';
import { insertPatch } from "@janeirodigital/interop-utils";
import { INTEROP } from "@janeirodigital/interop-namespaces";
import type { IProcessor, ISessionManager } from "@janeirodigital/sai-server-interfaces";
import type { IReciprocalRegistrationsJob } from "../models/jobs";
import { webhookTargetUri } from "../url-templates";

const logger = getLoggerFor('social-agent', 5, 5);

export class ReciprocalRegistrationsProcessor implements IProcessor {
  constructor(public sessionManager: ISessionManager) {}

  async processorFunction (job: IReciprocalRegistrationsJob): Promise<void> {
    const { webId, registeredAgent } = job.data
    const saiSession = await this.sessionManager.getSaiSession(webId)
    const registration = await saiSession.findSocialAgentRegistration(registeredAgent)
    if (!registration) throw Error(`registration for ${registeredAgent} was not found`)
    const reciprocalRegistrationIri = await registration.discoverReciprocal(saiSession.rawFetch)
    if (reciprocalRegistrationIri) {
      const quad = DataFactory.quad(
        DataFactory.namedNode(registration.iri),
        INTEROP.reciprocalRegistration,
        DataFactory.namedNode(reciprocalRegistrationIri)
      )
      const sparqlPatch = await insertPatch(new Store([quad]))
      await registration.applyPatch(sparqlPatch)

      try {
        // TODO(elf-pavlik): store subsciption details in store including expected sender's WebID
        const subsciption = await subscribe(
          reciprocalRegistrationIri,
          webhookTargetUri(webId, registeredAgent),
          { fetch: saiSession.rawFetch }
        )
      } catch (e) {
        logger.error('subscription failed')
      }
    }
  }
}
