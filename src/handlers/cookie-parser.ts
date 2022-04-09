import { MiddlewareHttpHandler } from "./middleware-http-handler";
import { HttpHandlerContext } from "@digita-ai/handlersjs-http";
import cookie from "cookie";
import { HttpSolidContext } from "../models/http-solid-context";
import { Observable, of } from "rxjs";

export class CookieSessionMiddleware implements MiddlewareHttpHandler {
  handle(context: HttpHandlerContext): Observable<HttpSolidContext> {
    const cookieHeader = context.request.headers["cookie"];

    if (!cookieHeader) return of(context);
    const cookies = cookie.parse(cookieHeader);
    const webId = getWebIdFromCookie(cookies);
    const sessionId = getSessionIdFromCookie(cookies);

    return of({
      ...context,
      webId,
      sessionId,
    });
  }
}

export const getWebIdFromCookie = (jsonCookie: { [k: string]: string }): string | undefined => {
  const webId = jsonCookie["webId"];
  return webId ? webId : undefined;
};

export const getSessionIdFromCookie = (jsonCookie: { [k: string]: string }): string | undefined => {
  const sessionId = jsonCookie["session"];

  if (!sessionId) return undefined;

  return Buffer.from(sessionId, "base64").toString("ascii");
};
