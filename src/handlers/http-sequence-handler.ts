import { Observable } from "rxjs";
import { HandlerArgumentError } from "@digita-ai/handlersjs-core";
import { HttpHandler, HttpHandlerContext, HttpHandlerResponse } from "@digita-ai/handlersjs-http";
import { MiddlewareHttpHandler } from "./middleware-http-handler";

export class HttpSequenceHandler<C extends HttpHandlerContext> implements HttpHandler<C> {
  constructor(public middleware: MiddlewareHttpHandler[], public handler: HttpHandler) {
    if (!middleware) {
      throw new HandlerArgumentError("Argument handlers should be set.", middleware);
    }
  }

  handle(ctx: HttpHandlerContext): Observable<HttpHandlerResponse> {
    for (const middleware of this.middleware) {
      middleware.handle(ctx).subscribe((newCtx) => (ctx = newCtx));
    }

    return this.handler.handle(ctx);
  }
}
