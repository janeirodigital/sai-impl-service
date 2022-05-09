import { catchError, delay, EMPTY, from, map, mergeMap, Observable, of, switchMap, tap, throwError } from "rxjs";
import { HandlerArgumentError } from "@digita-ai/handlersjs-core";
import { HttpHandler, HttpHandlerContext, HttpHandlerResponse } from "@digita-ai/handlersjs-http";
import { MiddlewareHttpHandler } from "./middleware-http-handler";
import { type } from "os";

export class HttpSequenceHandler<C extends HttpHandlerContext> implements HttpHandler<C> {
  constructor(public middleware: MiddlewareHttpHandler[], public handler: HttpHandler) {
    if (!middleware) {
      throw new HandlerArgumentError("Argument handlers should be set.", middleware);
    }
  }

  handle(ctx: HttpHandlerContext): Observable<HttpHandlerResponse> {
    let observable = of(ctx)
    for (const middleware of this.middleware) {
      observable = observable.pipe(
        mergeMap(ctx => middleware.handle(ctx))
      )
    }
    return observable.pipe(
      mergeMap(ctx => this.handler.handle(ctx)),
      catchError(err => {
        // TODO if (err instanceof HttpErrorResponse)
        return of(err as HttpHandlerResponse)
      })
    )
  }
}
