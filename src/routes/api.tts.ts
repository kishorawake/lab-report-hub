import { createFileRoute } from "@tanstack/react-router";

/**
 * Server-side TTS proxy. Bypasses browser CORS/referrer checks that block
 * direct calls to translate.google.com from the client.
 *
 * Usage: GET /api/tts?text=...&lang=hi
 * Returns: audio/mpeg stream
 */
export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const text = url.searchParams.get("text")?.trim();
        const lang = url.searchParams.get("lang")?.trim() || "en";

        if (!text) {
          return new Response("missing text", { status: 400 });
        }
        if (text.length > 200) {
          return new Response("text too long (max 200 chars)", { status: 400 });
        }

        const ttsUrl =
          `https://translate.google.com/translate_tts` +
          `?ie=UTF-8&q=${encodeURIComponent(text)}` +
          `&tl=${encodeURIComponent(lang)}` +
          `&total=1&idx=0&textlen=${text.length}&client=tw-ob`;

        try {
          const upstream = await fetch(ttsUrl, {
            headers: {
              // Google rejects requests without a "browser-like" UA / Referer
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                "(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
              "Referer": "https://translate.google.com/",
              "Accept": "audio/mpeg, audio/*;q=0.9, */*;q=0.5",
              "Accept-Language": "en-US,en;q=0.9",
            },
          });

          if (!upstream.ok || !upstream.body) {
            console.error("[tts] upstream failed", upstream.status, await upstream.text().catch(() => ""));
            return new Response(`upstream ${upstream.status}`, { status: 502 });
          }

          return new Response(upstream.body, {
            status: 200,
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "public, max-age=86400",
              "Access-Control-Allow-Origin": "*",
            },
          });
        } catch (err) {
          console.error("[tts] proxy error", err);
          return new Response("tts proxy error", { status: 500 });
        }
      },
    },
  },
});
