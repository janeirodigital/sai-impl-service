import type { CRUDDataRegistry } from "@janeirodigital/interop-data-model";
import type { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent";
import type { DataRegistration, DataRegistry } from "@janeirodigital/sai-api-messages";
import { ShapeTree } from "./descriptions";

const buildDataRegistry = async (
  registry: CRUDDataRegistry,
  descriptionsLang: string
): Promise<DataRegistry> => {
    const registrations: DataRegistration[] = [];
    for await (const registration of registry.registrations) {
        const shapeTree = await ShapeTree.build(registration.registeredShapeTree, descriptionsLang)
        registrations.push({
          id: registration.iri,
          shapeTree: registration.registeredShapeTree,
          dataRegistry: registry.iri,
          count: registration.contains.length,
          label: shapeTree.description?.label
        });
    }
    return {
      id: registry.iri,
      registrations
    }
}

export const getDataRegistries = async (agent: AuthorizationAgent, descriptionsLang: string) => {
  return Promise.all(agent.registrySet.hasDataRegistry.map(registry => buildDataRegistry(registry, descriptionsLang)))
};
