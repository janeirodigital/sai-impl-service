import { HttpHandlerContext } from "@digita-ai/handlersjs-http";
import { HttpContextHandler } from "./middleware-http-handler";
import { Observable, of } from "rxjs";

export class UrlEncodedBodyParser implements HttpContextHandler {
  public handle(context: HttpHandlerContext): Observable<HttpHandlerContext> {
    const body = decodeURIComponent(context.request.body);

    if (!body) {
      return of(context);
    }

    const pairs: { [key: string]: string } = {};

    body.split("&").forEach((pair) => {
      const { [0]: key, [1]: value } = pair.split("=");
      pairs[key] = decodeURIComponent(value);
    });

    const newContext = {
      ...context,
      request: {
        ...context.request,
        body: pairs,
      },
    };

    return of(newContext);
  }
}
