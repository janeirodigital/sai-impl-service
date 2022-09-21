import { from, Observable } from "rxjs";
import { BadRequestHttpError, HttpHandler, HttpHandlerResponse, NotFoundHttpError } from "@digita-ai/handlersjs-http";
import { getLoggerFor } from '@digita-ai/handlersjs-logging';
import { HttpHandlerContext, InternalServerError } from "@digita-ai/handlersjs-http";
import { AuthenticatedAuthnContext, AuthnContext } from "../models/http-solid-context";
import { decodeWebId } from "../url-templates";
import { validateContentType } from "../utils/http-validators";
import { ISessionManager } from "@janeirodigital/sai-server-interfaces";

export class PushSubscriptionHandler extends HttpHandler {

  private logger = getLoggerFor(this, 5, 5);

  constructor(
    private sessionManager: ISessionManager
  ) {
    super();
    this.logger.info("PushSubscriptionHandler::constructor");
  }
  handle(context: AuthenticatedAuthnContext): Observable<HttpHandlerResponse> {
    this.logger.info("PushSubscriptionHandler::handle");
    return from(this.handleAsync(context))
  }

  private async handleAsync(context: AuthenticatedAuthnContext): Promise<HttpHandlerResponse> {
    validateContentType(context, 'application/json');
    // TODO: validate subscription
    if (!context.request.body) {
      throw new BadRequestHttpError();
    }
    const subscription = context.request.body as PushSubscription;
    await this.sessionManager.addPushSubscription(context.authn.webId, subscription)

    return { body: {}, status: 204, headers: {} };
  }
}
