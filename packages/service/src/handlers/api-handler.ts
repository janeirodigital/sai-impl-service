import { from, Observable } from "rxjs";
import { BadRequestHttpError, HttpHandler, HttpHandlerResponse } from "@digita-ai/handlersjs-http";
import { getLoggerFor } from '@digita-ai/handlersjs-logging';
import { SaiContext } from "../models/http-solid-context";
import { RequestMessageTypes, ResponseMessageTypes } from "@janeirodigital/sai-api-messages";
import { getApplications, getDescriptions } from "../services";
import { validateContentType } from "../utils/http-validators";
import { getSocialAgents, addSocialAgent } from "../services/social-agents";
import { getDataRegistries } from "../services/data-registries";

export class ApiHandler extends HttpHandler {
  private logger = getLoggerFor(this, 5, 5);

  constructor() {
    super();
    this.logger.info("LoginHandler::constructor");
  }


  async handleAsync (context: SaiContext): Promise<HttpHandlerResponse> {
    validateContentType(context, 'application/json');
    const body = context.request.body
    if (!body) {
      throw new BadRequestHttpError()
    }
    switch(body.type) {
      case RequestMessageTypes.APPLICATIONS_REQUEST:
        return { body: {
          type: ResponseMessageTypes.APPLICATIONS_RESPONSE,
          payload: await getApplications(context.saiSession)
        }, status: 200, headers: {} }
      case RequestMessageTypes.SOCIAL_AGENTS_REQUEST:
        return { body: {
          type: ResponseMessageTypes.SOCIAL_AGENTS_RESPONSE,
          payload: await getSocialAgents(context.saiSession)
         }, status: 200, headers: {} }
      case RequestMessageTypes.ADD_SOCIAL_AGENT_REQUEST:
        return { body: {
          type: ResponseMessageTypes.SOCIAL_AGENT_RESPONSE,
          payload: await addSocialAgent(context.saiSession, context.request.body)
         }, status: 200, headers: {} }
      case RequestMessageTypes.DATA_REGISTRIES_REQUEST:
        return { body: {
          type: ResponseMessageTypes.DATA_REGISTRIES_RESPONSE,
          payload: await getDataRegistries(context.saiSession, body.lang)
         }, status: 200, headers: {} }
      case RequestMessageTypes.DESCRIPTIONS_REQUEST:
        return { body: {
          type: ResponseMessageTypes.DESCRIPTIONS_RESPONSE,
          payload: await getDescriptions(body.applicationId, body.lang)
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
