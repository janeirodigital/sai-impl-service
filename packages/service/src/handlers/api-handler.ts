import { from, Observable } from "rxjs";
import { BadRequestHttpError, HttpHandler, HttpHandlerResponse } from "@digita-ai/handlersjs-http";
import { getLoggerFor } from '@digita-ai/handlersjs-logging';
import { SaiContext } from "../models/http-solid-context";
import { getApplications } from "../services";

const ActionTypes = {
  APPLICATIONS_REQUESTED: '[APPLICATION PROFILES] Application Profiles Requested',
  APPLICATIONS_PROVIDED: '[APPLICATION PROFILES] Application Profiles Received'
}

interface Application {
  name: string;
  description: string;
}

export class ApiHandler extends HttpHandler {
  private logger = getLoggerFor(this, 5, 5);

  constructor() {
    super();
    this.logger.info("LoginHandler::constructor");
  }


  async handleAsync (context: SaiContext): Promise<HttpHandlerResponse> {

    switch(context.request.body?.type) {
      case ActionTypes.APPLICATIONS_REQUESTED:
        return { body: {
          type: ActionTypes.APPLICATIONS_PROVIDED,
          profiles: await getApplications(context.saiSession)
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
