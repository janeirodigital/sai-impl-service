import { SolidSessionMiddleware } from "../../src";
import { SessionManager } from "../../src";
import { InMemoryStorage } from "@inrupt/solid-client-authn-node";
import { HttpSolidContext } from "../../src";

jest.mock("../../src/sai-session-storage");
jest.mock("@inrupt/solid-client-authn-node");

describe("SolidSessionMiddleware", () => {
  let middleware: SolidSessionMiddleware;
  const manager = new SessionManager(new InMemoryStorage());

  beforeEach(() => {
    middleware = new SolidSessionMiddleware(manager);
  });

  test("context does not contain a webId", (done) => {
    const ctx = { webId: undefined, sessionId: "123" } as HttpSolidContext;
    middleware.handle(ctx).subscribe((innerCtx) => {
      expect(innerCtx).toEqual(ctx);
      done();
    });
  });

  test("context does not contain a sessionId", (done) => {
    const ctx = { sessionId: undefined, webId: "123" } as HttpSolidContext;

    middleware.handle(ctx).subscribe((innerCtx) => {
      expect(innerCtx).toEqual(ctx);
      done();
    });
  });

  test("middleware retrieves the right session from manager", (done) => {
    manager.get = jest.fn().mockReturnValueOnce(Promise.resolve(Object()));

    const webId = "http://me.id",
      sessionId = "session";
    const ctx = { sessionId, webId } as HttpSolidContext;
    middleware.handle(ctx).subscribe(() => {
      expect(manager.get).toBeCalledWith(webId);
      done();
    });
  });

  test("middleware adds the session to the new context", (done) => {
    manager.get = jest.fn().mockReturnValueOnce(Promise.resolve(Object()));
    const webId = "http://me.id",
      sessionId = "session";

    const ctx = { sessionId, webId } as HttpSolidContext;
    middleware.handle(ctx).subscribe((innerCtx) => {
      expect(innerCtx.saiSession).toEqual(Object());
      done();
    });
  });
});
