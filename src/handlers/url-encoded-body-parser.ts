import { HttpHandler, HttpHandlerContext, HttpHandlerResponse } from "@digita-ai/handlersjs-http";
import { Observable } from "rxjs";

export class UrlEncodedBodyParser implements HttpHandler {
  constructor(private handler: HttpHandler) {}

  public handle(context: HttpHandlerContext): Observable<HttpHandlerResponse> {
    const body = decodeURIComponent(context.request.body);

    if (!body) {
      return this.handler.handle(context);
    }

    const decodedBody = decodeURIComponent(body);
    const pairs: { [key: string]: string } = {};

    decodedBody.split("&").forEach((pair) => {
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

    return this.handler.handle(newContext);
  }
}
