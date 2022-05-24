import 'dotenv/config';

import path from "path";
import { ComponentsManager, IComponentsManagerBuilderOptions } from "componentsjs";
import { Server } from "@digita-ai/handlersjs-http";
import type { NodeHttpServer } from "@digita-ai/handlersjs-http";

export async function createServer(): Promise<Server> {
  // FIXME using path.dirname results in a url with a `file://` scheme which is not usable by the components
  //  manager below
  // const modulePath = path
  //   .dirname(import.meta.url)
  //   .substring(0, path.dirname(import.meta.url).lastIndexOf("/"));

  const modulePath = process.cwd();

  const managerProperties: IComponentsManagerBuilderOptions<Server> = {
    mainModulePath: modulePath,
    dumpErrorState: false,
    logLevel: "debug",
  };

  const configFile = path.join(modulePath, "config/alt-config.json");

  // Setup ComponentsJS
  const componentsManager = await ComponentsManager.build(managerProperties);
  await componentsManager.configRegistry.register(configFile);

  const service = "urn:solid:authorization-agent:default:Service";
  return await componentsManager.instantiate<NodeHttpServer>(service);
}

createServer().then((server) => {
  console.log("Server started on port 4000");
  server.start();
});
