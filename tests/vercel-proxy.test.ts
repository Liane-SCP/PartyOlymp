import { test } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/room/route";

test("Vercel room proxy validates requests and preserves upstream responses", async () => {
  const originalFetch = globalThis.fetch;
  const originalOrigin = process.env.OLYMP_BACKEND_ORIGIN;
  const request = (body = "{}", origin = "https://frontend.example") => new Request("https://frontend.example/api/room", {
    method: "POST", body, headers: { Origin: origin, "Content-Type": "application/json", Cookie: "private=cookie", Authorization: "Bearer private" },
  });
  try {
    delete process.env.OLYMP_BACKEND_ORIGIN;
    assert.equal((await POST(request())).status, 503);
    process.env.OLYMP_BACKEND_ORIGIN = "https://backend.example";
    assert.equal((await POST(request("{}", "https://attacker.example"))).status, 403);
    assert.equal((await POST(request("x".repeat(20000)))).status, 413);
    process.env.OLYMP_BACKEND_ORIGIN = "http://backend.example";
    assert.equal((await POST(request())).status, 503);
    process.env.OLYMP_BACKEND_ORIGIN = "https://frontend.example";
    assert.equal((await POST(request())).status, 503);
    process.env.OLYMP_BACKEND_ORIGIN = "https://backend.example";
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url), "https://backend.example/api/room");
      const headers = new Headers(options?.headers);
      assert.equal(headers.get("origin"), "https://backend.example");
      assert.equal(headers.get("authorization"), null);
      assert.equal(headers.get("cookie"), null);
      assert.equal(options?.redirect, "error");
      assert.equal(new TextDecoder().decode(options?.body as Uint8Array), '{"type":"poll"}');
      return Response.json({ error: "Raum nicht gefunden." }, { status: 404, headers: { "Set-Cookie": "upstream=secret" } });
    };
    const result = await POST(request('{"type":"poll"}'));
    assert.equal(result.status, 404);
    assert.equal(result.headers.get("cache-control"), "no-store");
    assert.equal(result.headers.get("set-cookie"), null);
    assert.deepEqual(await result.json(), { error: "Raum nicht gefunden." });
    globalThis.fetch = async () => new Response("login", { headers: { "Content-Type": "text/html" } });
    assert.equal((await POST(request())).status, 502);
    globalThis.fetch = async () => { throw new Error("offline"); };
    assert.equal((await POST(request())).status, 502);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalOrigin === undefined) delete process.env.OLYMP_BACKEND_ORIGIN;
    else process.env.OLYMP_BACKEND_ORIGIN = originalOrigin;
  }
});
