import { catchError, mergeMap, Observable, of } from "rxjs";
import { Handler } from "@digita-ai/handlersjs-core";
import { HttpHandlerContext } from "@digita-ai/handlersjs-http";
import { HttpContextHandler } from "./middleware-http-handler";

/**
 * Process the context of a request with the given handlers in preparation for the final HttpHandler
 */
export class HttpSequenceContextHandler<T extends HttpHandlerContext = HttpHandlerContext> implements Handler<T, T> {

  /**
   * @param contextHandlers List of preparing handlers to put the context through.
   */
  constructor(public contextHandlers: HttpContextHandler<T>[]) {}

  handle(ctx: T): Observable<T> {

    let observable = of(ctx)

    for (const handler of this.contextHandlers) {
      observable = observable.pipe(
        mergeMap(ctx => handler.handle(ctx))
      )
    }

    return observable
  }

}
