export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (error: string, status: number) => Response.json({ error }, {
  status, headers: { "Cache-Control": "no-store" },
});
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return json("Unzulässiger Ursprung.", 403);
  const configured = process.env.OLYMP_BACKEND_ORIGIN;
  if (!configured) return json("Das Spiel-Backend ist noch nicht konfiguriert.", 503);
  let backend: URL;
  try {
    backend = new URL(configured);
    if (backend.protocol !== "https:" || backend.username || backend.password ||
        backend.pathname !== "/" || backend.search || backend.hash ||
        backend.origin === new URL(request.url).origin) throw new Error();
  } catch { return json("Die Backend-Konfiguration ist ungültig.", 503); }
  if (Number(request.headers.get("content-length") ?? 0) >= 20000)
    return json("Eingabe zu groß.", 413);
  const reader = request.body?.getReader();
  if (!reader) return json("Eingabe fehlt.", 400);
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length >= 20000) { await reader.cancel(); return json("Eingabe zu groß.", 413); }
    chunks.push(value);
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
  try {
    const upstream = await fetch(new URL("/api/room", backend), {
      method: "POST", body,
      headers: { "Content-Type": "application/json", Origin: backend.origin },
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(6500),
    });
    if (!upstream.headers.get("content-type")?.includes("application/json"))
      return json("Das Spiel-Backend ist nicht erreichbar.", 502);
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    });
  } catch { return json("Das Spiel-Backend ist vorübergehend nicht erreichbar.", 502); }
}
