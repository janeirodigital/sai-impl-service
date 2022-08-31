import { INTEROP, buildNamespace } from "@janeirodigital/interop-namespaces";
import { parseTurtle } from "@janeirodigital/interop-utils"
import { getOneObject } from "../utils/rdf-parser";
import { parseJsonld } from "../utils/jsonld-parser";

// TODO (elf-pavlik) add to interop-namespaces
const SKOS = buildNamespace('http://www.w3.org/2004/02/skos/core#')

/**
 * Get the descriptions for the requested language. If the descriptions for the language are not found
 * `null` will be returned.
 * TODO (angel) handle cases where the target description set is not in the same graph and needs to be fetched
 *              from another resource.
 * @param agent Authorization Agent instance
 * @param applicationIri application's profile document IRI
 * @param targetLang XSD language requested, e.g.: "en", "es", "i-navajo".
 */
export const getDescriptions = async (
  applicationIri: string,
  targetLang: string
) => {
  const clientIdResponse = await fetch(applicationIri)
  const document = await parseJsonld(await clientIdResponse.text(), clientIdResponse.url)
  const accessNeedGroupIri = getOneObject(
    document.match(null, INTEROP.hasAccessNeedGroup)
  )?.value
  if (!accessNeedGroupIri) return null;
  const accessNeedGropupResponse = await fetch(accessNeedGroupIri)
  const accessNeedGroup = await parseTurtle(await accessNeedGropupResponse.text(), accessNeedGropupResponse.url)

  const descriptionSetIri = getOneObject(
    accessNeedGroup.match(null, INTEROP.hasAccessDescriptionSet)
  )?.value;

  if (!descriptionSetIri) return null;

  const descriptionSetResponse = await fetch(descriptionSetIri)
  const descriptionSet = await parseTurtle(await descriptionSetResponse.text(), descriptionSetResponse.url)
  // TODO (angel) contemplate cases where the descriptions are spread across multiple locations
  //              on the web. e.g.: .../desc-en.ttl, .../desc-es.ttl, etc.

  const langs = [...descriptionSet.match(null, INTEROP.usesLanguage)].map(
    (quad) => quad.object.value
  );

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
    if (!needId)
      needId = getOneObject(descriptionTriples.match(null, INTEROP.hasAccessNeed))?.value;

    descriptions.push({ id, label, description, needId });
  }
  return descriptions;
};
