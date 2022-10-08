import { from, Observable } from "rxjs";
import { HttpHandler, HttpHandlerResponse, BadRequestHttpError, UnauthorizedHttpError } from "@digita-ai/handlersjs-http";
import { getLoggerFor } from '@digita-ai/handlersjs-logging';
import type { AuthenticatedAuthnContext } from "../models/http-solid-context";
import { validateContentType } from "../utils/http-validators";
import { decodeWebId } from "../url-templates"
import { ISessionManager, IQueue } from "@janeirodigital/sai-server-interfaces";
import { IDelegatedGrantsJobData } from "../models/jobs";
import { sendWebPush } from "../services";

interface Notification {
  object: {
    id: string
  }
}

export class WebHooksHandler extends HttpHandler {
  private logger = getLoggerFor(this, 5, 5);

  constructor(
    private sessionManager: ISessionManager,
    private queue: IQueue
  ) {
    super();
    this.logger.info("WebHooksHandler::constructor");
  }

  async handleAsync (context: AuthenticatedAuthnContext): Promise<HttpHandlerResponse> {
    validateContentType(context, 'application/ld+json');

    // verify if sender is Authorized
    if (!this.senderAuthorized(context)) throw new UnauthorizedHttpError()

    const notification = context.request.body as Notification
    this.validateNotification(notification)

    const webId = decodeWebId(context.request.parameters!.encodedWebId)
    const peerWebId = decodeWebId(context.request.parameters!.encodedPeerWebId)

    if (webId === peerWebId) {
      // notification from user's access inbox
      // send push notification
      const pushSubscriptions = await this.sessionManager.getPushSubscriptions(webId)
      await sendWebPush(webId, pushSubscriptions)
    } else {
      // notification from a reciprocal agent registration
      // create job to update delegated data grants
      this.queue.add({ webId, registeredAgent: peerWebId } as IDelegatedGrantsJobData)
    }

    return { body: {}, status: 200, headers: {} }
  }

  handle(context: AuthenticatedAuthnContext): Observable<HttpHandlerResponse> {
    this.logger.info("WebHooksHandler::handle");
    return from(this.handleAsync(context))
  }

  validateNotification(notification: Notification): void {
    if (!notification.object.id) throw new BadRequestHttpError()
  }

  // TODO: as spec updates, use webId from subscription response
  senderAuthorized(context: AuthenticatedAuthnContext): boolean {
    return context.authn.webId === decodeWebId(context.request.parameters!.encodedPeerWebId)
  }
}
