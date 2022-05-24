import { AuthnContext, AuthorizationAgentContextHandler, SessionManager } from "../../src";
import { InMemoryStorage } from "@inrupt/solid-client-authn-node";

jest.mock("../../src/session-manager");
jest.mock("@inrupt/solid-client-authn-node");

describe("AuthorizationAgentContextHandler", () => {
  let authorizationAgentContextHandler: AuthorizationAgentContextHandler;
  const manager = new SessionManager(new InMemoryStorage());

  beforeEach(() => {
    authorizationAgentContextHandler = new AuthorizationAgentContextHandler(manager);
  });

  test("authorizationAgentContextHandler throws if the ctx does not provide a webid", (done) => {
    const ctx = { authn: { webId: undefined } } as unknown as AuthnContext;
    authorizationAgentContextHandler.handle(ctx).subscribe({
      error(e: Error) {
        expect(e.message).toEqual("Authentication not provided");
        done();
      }
    });
  });

  test("authorizationAgentContextHandler retrieves the right session from manager", (done) => {
    manager.getSaiSession = jest.fn().mockReturnValueOnce(Promise.resolve(Object()));

    const webId = "http://me.id";
    const ctx = { authn: { webId } } as AuthnContext;
    authorizationAgentContextHandler.handle(ctx).subscribe(() => {
      expect(manager.getSaiSession).toBeCalledWith(webId);
      done();
    });
  });

  test("authorizationAgentContextHandler adds the session to the new context", (done) => {
    manager.getSaiSession = jest.fn().mockReturnValueOnce(Promise.resolve(Object()));
    const webId = "http://me.id";

    const ctx = { authn: { webId } } as AuthnContext;
    authorizationAgentContextHandler.handle(ctx).subscribe((innerCtx) => {
      expect(innerCtx.saiSession).toEqual(Object());
      done();
    });
  });
});
