
import path from "path";
import { ComponentsManager, IComponentsManagerBuilderOptions } from "componentsjs";
import { Server } from "@digita-ai/handlersjs-http";
import type { NodeHttpServer } from "@digita-ai/handlersjs-http";
import { ConsoleLoggerFactory, getLoggerFor, setLogger, setLoggerFactory } from '@digita-ai/handlersjs-logging';

export async function createTestServer(): Promise<Server> {

  const modulePath = path.join(__dirname, '../..')
  const configFile = path.join(modulePath, "config/config.json");

  const managerProperties: IComponentsManagerBuilderOptions<Server> = {
    mainModulePath: modulePath,
    dumpErrorState: false,
    logLevel: "silly",
  };

  // Setup ComponentsJS
  const componentsManager = await ComponentsManager.build(managerProperties);
  await componentsManager.configRegistry.register(configFile);

  setLoggerFactory(new ConsoleLoggerFactory());
  setLogger(getLoggerFor('HTTP', 6, 6));

  const service = "urn:solid:authorization-agent:default:Service";
  return await componentsManager.instantiate<NodeHttpServer>(service);
}
