import { BadRequestHttpError, HttpHandlerContext } from "@digita-ai/handlersjs-http";

export const validateContentType = (ctx: HttpHandlerContext, contentType: string): void => {
  if (
    ctx.request.headers['content-type'] &&
    ctx.request.headers['content-type'].toLowerCase() === contentType.toLowerCase()
  ) {
    return;
  }

  throw new BadRequestHttpError('Missing content-type');
}
