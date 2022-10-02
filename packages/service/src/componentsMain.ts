import path from "path";
import { ComponentsManager, IComponentsManagerBuilderOptions } from "componentsjs";
import type { Server, NodeHttpServer } from "@digita-ai/handlersjs-http";
import { ConsoleLoggerFactory, getLoggerFor, setLogger, setLoggerFactory } from '@digita-ai/handlersjs-logging';

setLoggerFactory(new ConsoleLoggerFactory());
const logger = getLoggerFor('HTTP', 6, 6)
setLogger(logger);

export async function createServer(): Promise<Server> {
  // FIXME using path.dirname results in a url with a `file://` scheme which is not usable by the components
  //  manager below
  // const modulePath = path
  //   .dirname(import.meta.url)
  //   .substring(0, path.dirname(import.meta.url).lastIndexOf("/"));

  const modulePath = path.join(__dirname, '..')
  const configFile = path.join(modulePath, "config/development.json");

  const managerProperties: IComponentsManagerBuilderOptions<Server> = {
    mainModulePath: modulePath,
    dumpErrorState: false,
    logLevel: "debug",
  };


  // Setup ComponentsJS
  const componentsManager = await ComponentsManager.build(managerProperties);
  await componentsManager.configRegistry.register(configFile);


  const service = "urn:solid:authorization-agent:default:Service";
  return await componentsManager.instantiate<NodeHttpServer>(service);
}

createServer().then((server) => {
  logger.info("Server started on port 4000");
  server.start();
});
