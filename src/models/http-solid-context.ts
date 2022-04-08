import { HttpHandlerContext, HttpHandlerRequest } from "@digita-ai/handlersjs-http";

export interface SolidHttpRequest extends HttpHandlerRequest {
  webId: string;
}

export interface HttpSolidContext extends HttpHandlerContext {
  request: SolidHttpRequest;
}
