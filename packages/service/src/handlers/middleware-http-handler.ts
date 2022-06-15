import { HttpHandlerContext } from "@digita-ai/handlersjs-http";
import { Observable } from "rxjs";
import { Handler } from "@digita-ai/handlersjs-core";

/**
 * Acts based on the given HttpHandlerContext.
 */
export abstract class HttpContextHandler<T extends HttpHandlerContext = HttpHandlerContext> extends Handler<T, T> {
  abstract handle(context: T): Observable<T>;
}
