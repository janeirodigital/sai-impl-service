import { from, Observable } from "rxjs";
import { BadRequestHttpError, HttpHandler, HttpHandlerResponse } from "@digita-ai/handlersjs-http";
import { getLoggerFor } from '@digita-ai/handlersjs-logging';
import { SaiContext } from "../models/http-solid-context";
import { MessageTypes } from "@janeirodigital/sai-api-messages";
import { getApplications } from "../services";

export class ApiHandler extends HttpHandler {
  private logger = getLoggerFor(this, 5, 5);

  constructor() {
    super();
    this.logger.info("LoginHandler::constructor");
  }


  async handleAsync (context: SaiContext): Promise<HttpHandlerResponse> {

    switch(context.request.body?.type) {
      case MessageTypes.APPLICATIONS_REQUEST:
        return { body: {
          type: MessageTypes.APPLICATIONS_RESPONSE,
          // TODO push down to sai-js to directly use an array from  context.saiSession.applicationRegistrations
          payload: await getApplications(context.saiSession)
        }, status: 200, headers: {} }
      default:
        throw new BadRequestHttpError()

    }
  }

  handle(context: SaiContext): Observable<HttpHandlerResponse> {
    this.logger.info("ApiHandler::handle");
    return from(this.handleAsync(context))
  }
}
