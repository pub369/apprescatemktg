import { getStore } from "@netlify/blobs";

const store = getStore("apprescatemktg-metrics");
const counterKey = "site-visits";
const headers = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff"
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers });
}

export default async function handler(request) {
  if (request.method !== "GET") {
    return new Response(null, {
      status: 405,
      headers: { ...headers, Allow: "GET" }
    });
  }

  try {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const current = await store.getWithMetadata(counterKey, { type: "json" });
      const count = current?.data?.count ?? 0;

      if (!Number.isSafeInteger(count) || count < 0) {
        throw new Error("El valor guardado para el contador no es válido");
      }

      const nextCount = count + 1;
      const writeOptions = current
        ? { onlyIfMatch: current.etag }
        : { onlyIfNew: true };
      const result = await store.setJSON(counterKey, { count: nextCount }, writeOptions);

      if (result.modified) {
        return jsonResponse({ count: nextCount });
      }
    }

    return jsonResponse({ error: "No se pudo actualizar el contador" }, 503);
  } catch (error) {
    console.error("No se pudo actualizar el contador de visitas.", error);
    return jsonResponse({ error: "No se pudo actualizar el contador" }, 500);
  }
}
