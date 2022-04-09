import { getSessionIdFromCookie, getWebIdFromCookie } from "../../src/handlers/cookie-parser";

describe("getWebIdFromCookie", () => {
  test("empty cookies return undefined", () => {
    expect(getWebIdFromCookie({})).toBe(undefined);
  });

  test("valid cookie without webId return undefined", () => {
    const value = "1234";
    const cookie = { value };
    expect(getWebIdFromCookie(cookie)).toEqual(undefined);
  });

  test("valid cookie return valid webId", () => {
    const webId = "http://test.id/me";
    const cookie = { webId };
    expect(getWebIdFromCookie(cookie)).toEqual(webId);
  });
});

describe("getSessionIdFromCookie", () => {
  test("empty cookies return undefined", () => {
    expect(getSessionIdFromCookie({})).toBe(undefined);
  });

  test("base64 input returns decoded value", () => {
    const b64Input = "YmI4YWVhODEtYmE0Ny00MjEzLTkyNjEtYzFmNzgyZWE1MWJj";
    const expected = "bb8aea81-ba47-4213-9261-c1f782ea51bc";
    expect(getSessionIdFromCookie({ session: b64Input })).toEqual(expected);
  });
});
