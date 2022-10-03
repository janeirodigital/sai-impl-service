import path from "path";
import { ComponentsManager, IComponentsManagerBuilderOptions } from "componentsjs";
import type { Server, NodeHttpServer } from "@digita-ai/handlersjs-http";
import { ConsoleLoggerFactory, getLoggerFor, setLogger, setLoggerFactory } from '@digita-ai/handlersjs-logging';
import { IWorker } from "@janeirodigital/sai-server-interfaces";

setLoggerFactory(new ConsoleLoggerFactory());
const logger = getLoggerFor('HTTP', 6, 6)
setLogger(logger);

export async function createServer(): Promise<{ server: Server, worker: IWorker}> {
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

  const workerIri = "urn:solid:authorization-agent:worker:ReciprocalRegistrations";
  const worker = await componentsManager.instantiate<IWorker>(workerIri);

  const serviceIri = "urn:solid:authorization-agent:default:Service";
  const service =  await componentsManager.instantiate<NodeHttpServer>(serviceIri);
  return { server: service, worker}
}

createServer().then(async ({ server, worker }) => {
  server.start();
  logger.info("Server started on port 4000");
  await worker.run()
});
