import { AuthorizationAgent } from '@janeirodigital/authorization-agent';
import {getOneObject, getOneSubject} from "../utils/rdf-parser";
import { INTEROP, SKOS } from '@janeirodigital/interop-namespaces';



/**
 * Get the descriptions for the requested language. If the descriptions for the language are not found
 * `null` will be returned.
 * TODO (angel) handle cases where the target description set is not in the same graph and needs to be fetched
 *              from another resource.
 * @param agent Authorization Agent instance
 * @param applicationIri application's profile document IRI
 * @param targetLang XSD language requested, e.g.: "en", "es", "i-navajo".
 */
export const getDescriptions = async (agent: AuthorizationAgent, applicationIri: string, targetLang: string) => {

    const document = await agent.fetch(applicationIri).then(r => r.dataset());
    const descriptionSetIri = getOneObject(document.match(null, INTEROP.hasAccessDescriptionSet))?.value;

    if (!descriptionSetIri) return null;

    const descriptionSet = await agent.fetch(descriptionSetIri).then(r => r.dataset());
    // TODO (angel) contemplate cases where the descriptions are spread across multiple locations
    //              on the web. e.g.: .../desc-en.ttl, .../desc-es.ttl, etc.

    const langs = [...descriptionSet.match(null, INTEROP.usesLanguage)].map(quad => quad.object.value);

    if (!langs.includes(targetLang)) return null;

    const targets = descriptionSet.match(null, INTEROP.inAccessDescriptionSet);

    // TODO (angel) typings
    const descriptions = [];
    for (const target of targets) {
        const descriptionTriples = descriptionSet.match(target.subject);

        const id = target.subject.value;
        const label = getOneObject(descriptionTriples.match(null, SKOS.prefLabel))?.value;
        const description = getOneObject(descriptionTriples.match(null, SKOS.description))?.value;
        let needId = getOneObject(descriptionTriples.match(null, INTEROP.hasAccessNeedGroup))?.value;
        if (!needId) needId = getOneObject(descriptionTriples.match(null, INTEROP.hasAccessNeed))?.value;

        descriptions.push({id, label, description, needId});
    }
    return descriptions;
}