import { XSD, INTEROP, SHAPETREES, buildNamespace } from "@janeirodigital/interop-namespaces";
import { parseTurtle } from "@janeirodigital/interop-utils"
import { IRI } from "@janeirodigital/sai-api-messages"
import { getOneObject, getOneSubject, getAllSubjects, getAllObjects } from "../utils/rdf-parser";
import { parseJsonld } from "../utils/jsonld-parser";
import { DatasetCore, NamedNode } from "@rdfjs/types";
import { Store, DataFactory } from "n3";

// TODO (elf-pavlik) add to interop-namespaces
const SKOS = buildNamespace('http://www.w3.org/2004/02/skos/core#')

class Resource {

  public node: NamedNode
  public dataset: DatasetCore = new Store()

  constructor(public iri: IRI) {
    this.node = DataFactory.namedNode(iri)
  }

  protected async fetchData(): Promise<void> {
    const response = await fetch(this.iri)
    this.dataset = await parseTurtle(await response.text(), response.url)
  }

  protected async bootstrap(): Promise<void> {
    await this.fetchData()
  }
}

class AccessDescription extends Resource {
  constructor(public iri: IRI, public dataset: DatasetCore) {
    super(iri)
  }

  public get label (): string | undefined {
    return getOneObject(this.dataset.match(this.node, SKOS.prefLabel))?.value;
  }

  public get definition (): string | undefined {
    return getOneObject(this.dataset.match(this.node, SKOS.definition))?.value;
  }
}

class AccessNeedDescription extends AccessDescription {
  public get accessNeed(): string {
    return getOneObject(this.dataset.match(this.node, INTEROP.hasAccessNeed))!.value;
  }
}

class AccessNeedGroupDescription extends AccessDescription {
  public get accessNeedGroup(): string | undefined {
    return getOneObject(this.dataset.match(this.node, INTEROP.hasAccessNeedGroup))?.value;
  }
}

class AccessDescriptionSet extends Resource {

  private get descriptionSubjects() {
    return getAllSubjects(this.dataset.match(null, INTEROP.inAccessDescriptionSet));
  }

  get accessNeedGroupDescriptions(): AccessNeedGroupDescription[] {
    return this.descriptionSubjects
      .filter(subject => this.dataset.match(subject, INTEROP.hasAccessNeedGroup).size)
      .map(subject => new AccessNeedGroupDescription(subject.value, this.dataset))
  }

  get accessNeedDescriptions(): AccessNeedDescription[] {
    return this.descriptionSubjects
      .filter(subject => this.dataset.match(subject, INTEROP.hasAccessNeed).size)
      .map(subject => new AccessNeedDescription(subject.value, this.dataset))
  }

  public static async build (iri: IRI): Promise<AccessDescriptionSet> {
    const instance = new AccessDescriptionSet(iri)
    await instance.bootstrap()
    return instance
  }

}

class ShapeTree extends Resource {
  public static async build (iri: IRI): Promise<ShapeTree> {
    const instance = new ShapeTree(iri)
    await instance.bootstrap()
    return instance
  }
}

class ShapeTreeDescription extends Resource {

  public get label (): string | undefined {
    return getOneObject(this.dataset.match(this.node, SKOS.prefLabel))?.value;
  }

  public get definition (): string | undefined {
    return getOneObject(this.dataset.match(this.node, SKOS.definition))?.value;
  }

  public static async build (iri: IRI): Promise<ShapeTreeDescription> {
    const instance = new ShapeTreeDescription(iri)
    await instance.bootstrap()
    return instance
  }
}

type DescriptionsIndex = { [key: IRI]: ShapeTreeDescription }

class AccessNeedGroup extends Resource {

  accessDescriptionSet?: AccessDescriptionSet
  shapeTreeDescriptions: DescriptionsIndex = {}

  constructor(iri: IRI, public descriptionsLang: string) {
    super(iri)
  }

  public async getAccessDescriptionSet(): Promise<AccessDescriptionSet | undefined> {

    // we can skip matching on INTEROP.hasAccessDescriptionSet since nothing else uses INTEROP.usesLanguage
    const descriptionSetIri = getOneSubject(this.dataset.match(null, INTEROP.usesLanguage, DataFactory.literal(this.descriptionsLang, XSD.language)))?.value
    if (!descriptionSetIri) return
    return AccessDescriptionSet.build(descriptionSetIri)
  }

  public async getShapeTreeDescriptions(): Promise<DescriptionsIndex> {
    const index: DescriptionsIndex = {}
    const shapeTreeIris = [... new Set(getAllObjects(this.dataset.match(null, INTEROP.registeredShapeTree)).map(node => node.value))]
    const shapeTrees = await Promise.all(shapeTreeIris.map(ShapeTree.build))
    for (const shapeTree of shapeTrees) {
      const descriptionSetNode = getOneSubject(shapeTree.dataset.match(null, SHAPETREES.usesLanguage, DataFactory.literal(this.descriptionsLang, XSD.language)))
      if (!descriptionSetNode) continue
      const descriptionNodes = getAllSubjects(shapeTree.dataset.match(null, SHAPETREES.describes, shapeTree.node))
      // get description from the set for the language (in specific description set)
      const descriptionIri = descriptionNodes.filter(node => {
        return shapeTree.dataset.match(node, SHAPETREES.inDescriptionSet, descriptionSetNode)
      }).shift()?.value
      if (descriptionIri) {
        index[shapeTree.iri] = await ShapeTreeDescription.build(descriptionIri)
      }
    }
    return index
  }

  public getShapeTreeDescriptionForNeed(needIri: IRI): IShapeTreeDescription | undefined {
    const shapeTreeIri = getOneObject(this.dataset.match(DataFactory.namedNode(needIri), INTEROP.registeredShapeTree, null))?.value
    if (!shapeTreeIri) return
    const description = this.shapeTreeDescriptions[shapeTreeIri]
    if (!description) return
    return {
      label: description.label,
      definition: description.definition
    }
  }

  protected async bootstrap(): Promise<void> {
    await super.bootstrap()
    this.accessDescriptionSet = await this.getAccessDescriptionSet()
    this.shapeTreeDescriptions = await this.getShapeTreeDescriptions()
  }

  public static async build (iri: IRI, descriptionsLang: string): Promise<AccessNeedGroup> {
    const instance = new AccessNeedGroup(iri, descriptionsLang)
    await instance.bootstrap()
    return instance
  }
}

interface IShapeTreeDescription {
  label?: string,
  definition?: string
}

async function discoverAccessNeeedGroup(applicationIri: IRI): Promise<IRI | undefined> {
  const clientIdResponse = await fetch(applicationIri)
  const document = await parseJsonld(await clientIdResponse.text(), clientIdResponse.url)
  return getOneObject(
    document.match(null, INTEROP.hasAccessNeedGroup)
  )?.value
}

/**
 * Get the descriptions for the requested language. If the descriptions for the language are not found
 * `null` will be returned.
 * @param applicationIri application's profile document IRI
 * @param descriptionsLang XSD language requested, e.g.: "en", "es", "i-navajo".
 */
export const getDescriptions = async (
  applicationIri: string,
  descriptionsLang: string
) => {

  const accessNeedGroupIri = await discoverAccessNeeedGroup(applicationIri)
  if (!accessNeedGroupIri) return null;

  const accessNeedGroup = await AccessNeedGroup.build(accessNeedGroupIri, descriptionsLang)
  if (!accessNeedGroup.accessDescriptionSet) return null;

  return [
    ...accessNeedGroup.accessDescriptionSet.accessNeedGroupDescriptions.map(desc => ({
      id: desc.iri,
      label: desc.label,
      description: desc.definition,
      needId: desc.accessNeedGroup
    })),
    ...accessNeedGroup.accessDescriptionSet.accessNeedDescriptions.map(desc => ({
      id: desc.iri,
      label: desc.label,
      description: desc.definition,
      needId: desc.accessNeed,
      shapeTreeDescription: accessNeedGroup.getShapeTreeDescriptionForNeed(desc.accessNeed)
    }))
  ]
};
