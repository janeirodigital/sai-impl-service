import { HttpHandlerContext } from "@digita-ai/handlersjs-http";
import { Observable } from "rxjs";

export abstract class MiddlewareHttpHandler<C extends HttpHandlerContext = HttpHandlerContext> {
  abstract handle(context: C): Observable<C>;
}
