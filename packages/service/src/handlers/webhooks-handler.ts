import { from, Observable } from "rxjs";
import { HttpHandler, HttpHandlerResponse, BadRequestHttpError, UnauthorizedHttpError } from "@digita-ai/handlersjs-http";
import { getLoggerFor } from '@digita-ai/handlersjs-logging';
import type { AuthenticatedAuthnContext } from "../models/http-solid-context";
import { validateContentType } from "../utils/http-validators";
import { decodeWebId } from "../url-templates"

interface Notification {
  object: {
    id: string
  }
}

export class WebHooksHandler extends HttpHandler {
  private logger = getLoggerFor(this, 5, 5);

  constructor() {
    super();
    this.logger.info("WebHooksHandler::constructor");
  }

  async handleAsync (context: AuthenticatedAuthnContext): Promise<HttpHandlerResponse> {
    validateContentType(context, 'application/ld+json');

    // verify if sender is Authorized
    if (!this.senderAuthorized(context)) throw new UnauthorizedHttpError()

    // TODO(elf-pavlik): handle notification as RDF

    const notification = context.request.body as Notification
    this.validateNotification(notification)

    this.createJob(decodeWebId(context.request.parameters!.encodedWebId), notification.object.id)

    return { body: {}, status: 200, headers: {} }
  }

  handle(context: AuthenticatedAuthnContext): Observable<HttpHandlerResponse> {
    this.logger.info("WebHooksHandler::handle");
    return from(this.handleAsync(context))
  }

  // TODO(elf-pavlik): create background job which will use user's AA
  createJob(webId: string, registrationIri: string): void {
    this.logger.info('creating job for:', { webId, registrationIri })
  }

  validateNotification(notification: Notification): void {
    if (!notification.object.id) throw new BadRequestHttpError()
  }

  // TODO: as spec updates, use webId from subscription response
  senderAuthorized(context: AuthenticatedAuthnContext): boolean {
    return context.authn.webId === decodeWebId(context.request.parameters!.encodedPeerWebId)
  }
}
