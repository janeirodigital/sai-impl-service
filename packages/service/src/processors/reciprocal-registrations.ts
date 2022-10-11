import { Store, DataFactory } from "n3";
import { subscribe } from "solid-webhook-client";
import { insertPatch } from "@janeirodigital/interop-utils";
import { INTEROP } from "@janeirodigital/interop-namespaces";
import type { IProcessor, ISessionManager } from "@janeirodigital/sai-server-interfaces";
import type { IReciprocalRegistrationsJob } from "../models/jobs";
import { webhookTargetUrl } from "../url-templates";

// Indepotent processor, if reciprocal registration already known if will not try to rediscover it
// Webhook subscription can be retried

export class ReciprocalRegistrationsProcessor implements IProcessor {
  constructor(public sessionManager: ISessionManager) {}

  async processorFunction (job: IReciprocalRegistrationsJob): Promise<void> {
    const { webId, registeredAgent } = job.data
    const saiSession = await this.sessionManager.getSaiSession(webId)
    const registration = await saiSession.findSocialAgentRegistration(registeredAgent)
    if (!registration) throw Error(`registration for ${registeredAgent} was not found`)
    // TODO define getters as mixin in sai-js and apply to both Readable and CRUD
    let reciprocalRegistrationIri = registration.getObject(INTEROP.reciprocalRegistration)?.value ?? null
    if (!reciprocalRegistrationIri) {
      reciprocalRegistrationIri = await registration.discoverReciprocal(saiSession.rawFetch)
      if (!reciprocalRegistrationIri) throw new Error(`reciprocal registration not found for ${registeredAgent}`)
      const quad = DataFactory.quad(
        DataFactory.namedNode(registration.iri),
        INTEROP.reciprocalRegistration,
        DataFactory.namedNode(reciprocalRegistrationIri)
      )
      const sparqlPatch = await insertPatch(new Store([quad]))
      await registration.applyPatch(sparqlPatch)
    }

    // manage webook subscription

    if (await this.sessionManager.getWebhookSubscription(webId, registeredAgent)) return
    const subsciption = await subscribe(
      reciprocalRegistrationIri,
      webhookTargetUrl(webId, registeredAgent),
      { fetch: saiSession.rawFetch }
    )
    return this.sessionManager.setWebhookSubscription(webId, registeredAgent, subsciption)
  }
}
