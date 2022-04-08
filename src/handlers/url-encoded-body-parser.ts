import { HttpHandlerContext } from "@digita-ai/handlersjs-http";
import { MiddlewareHttpHandler } from "./middleware-http-handler";

export class UrlEncodedBodyParser implements MiddlewareHttpHandler {
  public handle(context: HttpHandlerContext): HttpHandlerContext {
    const body = decodeURIComponent(context.request.body);

    if (!body) {
      return context;
    }

    const pairs: { [key: string]: string } = {};

    body.split("&").forEach((pair) => {
      const { [0]: key, [1]: value } = pair.split("=");
      pairs[key] = decodeURIComponent(value);
    });

    const newContext = {
      route: context.route,
      request: {
        ...context.request,
        body: pairs,
      },
    };

    return newContext;
  }
}
