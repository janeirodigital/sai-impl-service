import type { DatasetCore, NamedNode } from "@rdfjs/types";
import { Store, DataFactory } from "n3";
import { DataAuthorizationData, ReadableShapeTreeDescription } from "@janeirodigital/interop-data-model";
import type { AuthorizationAgent, AccessAuthorizationStructure, NestedDataAuthorizationData } from "@janeirodigital/interop-authorization-agent";
import { XSD, SKOS, INTEROP } from "@janeirodigital/interop-namespaces";
import { parseTurtle } from "@janeirodigital/interop-utils"
import type { IRI, AuthorizationData, AccessNeed as IAccessNeed, Authorization, AccessAuthorization } from "@janeirodigital/sai-api-messages"
import { getOneObject, getOneSubject, getAllSubjects, getAllObjects } from "../utils/rdf-parser";

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

type DescriptionsIndex = { [key: IRI]: ReadableShapeTreeDescription }

class AccessNeedGroup extends Resource {

  accessDescriptionSet?: AccessDescriptionSet
  shapeTreeDescriptions: DescriptionsIndex = {}

  accessNeeds: IAccessNeed[] = []
  accessNeedsIndex: { [key:IRI]: IAccessNeed } = {}

  get description(): AccessNeedGroupDescription {
    return this.accessDescriptionSet!.accessNeedGroupDescriptions.find(desc => desc.accessNeedGroup === this.iri)!;
  }

  constructor(iri: IRI, public descriptionsLang: string, public saiSession: AuthorizationAgent) {
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
    const shapeTrees = await Promise.all(shapeTreeIris.map(iri => this.saiSession.factory.readable.shapeTree(iri, this.descriptionsLang)))
    for (const shapeTree of shapeTrees) {
      if (shapeTree.descriptions[this.descriptionsLang]) {
        index[shapeTree.iri] = shapeTree.descriptions[this.descriptionsLang]
      }
    }
    return index
  }

  public getShapeTreeForNeed(needIri: IRI): IRI {
    return getOneObject(this.dataset.match(DataFactory.namedNode(needIri), INTEROP.registeredShapeTree, null))!.value
  }

  public getShapeTreeDescriptionForNeed(needIri: IRI): IShapeTreeDescription | undefined {
    const shapeTreeIri = this.getShapeTreeForNeed(needIri)
    const description = this.shapeTreeDescriptions[shapeTreeIri]
    if (!description) return
    return {
      label: description.label,
      definition: description.definition
    }
  }

  private buildAccessNeed(needNode: NamedNode): IAccessNeed {
    const description = this.accessDescriptionSet?.accessNeedDescriptions.find(desc => desc.accessNeed === needNode.value);
    const parent = getOneObject(this.dataset.match(needNode, INTEROP.inheritsFromNeed))?.value
    const need = {
      id: needNode.value,
      label: description!.label!,
      description: description?.definition,
      access: getAllObjects(this.dataset.match(needNode, INTEROP.accessMode)).map(node => node.value),
      shapeTree: {
        id: this.getShapeTreeForNeed(needNode.value),
        label: this.getShapeTreeDescriptionForNeed(needNode.value)!.label!
      },
      parent,
      children: getAllSubjects(this.dataset.match(null, INTEROP.inheritsFromNeed, needNode))
        .map(node => this.buildAccessNeed(node as NamedNode))
    }
    this.accessNeedsIndex[need.id] = need
    return need
  }

  private buildAccessNeeds(): IAccessNeed[] {
    return getAllObjects(this.dataset.match(this.node, INTEROP.hasAccessNeed)).map(node => this.buildAccessNeed(node as NamedNode))
  }

  protected async bootstrap(): Promise<void> {
    await super.bootstrap()
    this.accessDescriptionSet = await this.getAccessDescriptionSet()
    this.shapeTreeDescriptions = await this.getShapeTreeDescriptions()
    this.accessNeeds = this.buildAccessNeeds()
  }

  public static async build (iri: IRI, descriptionsLang: string, saiSession: AuthorizationAgent): Promise<AccessNeedGroup> {
    const instance = new AccessNeedGroup(iri, descriptionsLang, saiSession)
    await instance.bootstrap()
    return instance
  }
}

interface IShapeTreeDescription {
  label?: string,
  definition?: string
}

/**
 * Get the descriptions for the requested language. If the descriptions for the language are not found
 * `null` will be returned.
 * @param applicationIri application's profile document IRI
 * @param descriptionsLang XSD language requested, e.g.: "en", "es", "i-navajo".
 * @param saiSession Authoirization Agent from `@janeirodigital/interop-authorization-agent`
 */
export const getDescriptions = async (
  applicationIri: string,
  descriptionsLang: string,
  saiSession: AuthorizationAgent
): Promise<AuthorizationData | null> => {

  const clientIdDocument = await saiSession.factory.readable.clientIdDocument(applicationIri)
  if (!clientIdDocument.hasAccessNeedGroup) return null;

  const accessNeedGroup = await AccessNeedGroup.build(clientIdDocument.hasAccessNeedGroup, descriptionsLang, saiSession)
  if (!accessNeedGroup.accessDescriptionSet) return null;

  return {
    id: applicationIri,
    accessNeedGroup: {
      id: accessNeedGroup.iri,
      label: accessNeedGroup.description.label!,
      description: accessNeedGroup.description.definition,
      needs: accessNeedGroup.accessNeeds
    }
  }
};

// currently the spec only anticipates one level of inheritance
// since we still don't have IRIs at this point, we need to use nesting to represent inheritance
function buildDataAuthorizations(authorization: Authorization, accessNeedGroup: AccessNeedGroup): NestedDataAuthorizationData[] {
  const structuredDataAuthorizations = authorization.dataAuthorizations.map(dataAuthorization => {
    const accessNeed = accessNeedGroup.accessNeedsIndex[dataAuthorization.accessNeed]
    const saiReady: DataAuthorizationData = {
      satisfiesAccessNeed: accessNeed.id,
      grantee: authorization.grantee,
      registeredShapeTree: accessNeed!.shapeTree.id,
      scopeOfAuthorization: INTEROP[dataAuthorization.scope].value,
      accessMode: accessNeed!.access
      // TODO handle more specific scopes
    }
    return saiReady
  })
  const parents: NestedDataAuthorizationData[] = []
  const children: DataAuthorizationData[] = []
  for (const structuredDataAuthorization of structuredDataAuthorizations) {
    if(structuredDataAuthorization.scopeOfAuthorization === INTEROP.Inherited.value) {
      children.push(structuredDataAuthorization)
    } else {
      parents.push(structuredDataAuthorization)
    }
  }
  return parents.map(parentDataAuthorization => {

    // add children for reach parent
    const inheritingDataAuthorizations = children.filter(childDataAuthorization => {
      const accessNeed = accessNeedGroup.accessNeedsIndex[childDataAuthorization.satisfiesAccessNeed!]
      return accessNeed.parent === parentDataAuthorization.satisfiesAccessNeed
    })
    if (inheritingDataAuthorizations.length) {
      parentDataAuthorization.children = inheritingDataAuthorizations
    }
    return parentDataAuthorization
  })
}

export const recordAuthoirization = async (
  authorization: Authorization,
  saiSession: AuthorizationAgent
): Promise<AccessAuthorization> => {
  const accessNeedGroup = await AccessNeedGroup.build(authorization.accessNeedGroup, 'en', saiSession) // TODO build without descriptions
  const structure: AccessAuthorizationStructure = {
    grantee: authorization.grantee,
    hasAccessNeedGroup: authorization.accessNeedGroup,
    dataAuthorizations: buildDataAuthorizations(authorization, accessNeedGroup)
  }

  const recorded = await saiSession.recordAccessAuthorization(structure)
  // we need to ensure that Application Registration exists before generating Access Grant!
  if (!(await saiSession.findApplicationRegistration(authorization.grantee))) {
    await saiSession.registrySet.hasAgentRegistry.addApplicationRegistration(authorization.grantee)
  }
  await saiSession.generateAccessGrant(recorded.iri)
  return { id: recorded.iri, ...authorization}
}
