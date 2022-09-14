import { CRUDDataRegistry } from "@janeirodigital/interop-data-model";
import { AuthorizationAgent } from "@janeirodigital/interop-authorization-agent";
import { DataRegistration, DataRegistry } from "@janeirodigital/sai-api-messages";

const buildDataRegistry = async (
  registry: CRUDDataRegistry
): Promise<DataRegistry> => {
    const registrations: DataRegistration[] = [];
    for await (const registration of registry.registrations) {
        registrations.push({
          id: registration.iri,
          shapeTree: registration.registeredShapeTree,
          dataRegistry: registry.iri
        });
    }
    return {
      id: registry.iri,
      registrations
    }
}

export const getDataRegistries = async (agent: AuthorizationAgent) => {
  return Promise.all(agent.registrySet.hasDataRegistry.map(buildDataRegistry))
};
