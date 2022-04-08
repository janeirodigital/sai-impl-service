import { HttpHandlerContext } from "@digita-ai/handlersjs-http";

export abstract class MiddlewareHttpHandler<C extends HttpHandlerContext = HttpHandlerContext> {
  abstract handle(context: C): C;
}
