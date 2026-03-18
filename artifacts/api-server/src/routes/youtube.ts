import { Router, type IRouter } from "express";
import { z } from "zod";
import { ai } from "@workspace/integrations-gemini-ai";

const SearchYoutubeQueryParams = z.object({ query: z.string().min(1) });

const router: IRouter = Router();

const videoCache = new Map<string, { videoId: string; title: string; thumbnail: string } | null>();

function extractJson(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

router.get("/youtube/search", async (req, res) => {
  const parsed = SearchYoutubeQueryParams.safeParse({ query: req.query.query });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }

  const { query } = parsed.data;

  if (videoCache.has(query)) {
    const cached = videoCache.get(query);
    if (cached) {
      res.json(cached);
    } else {
      res.json({ videoId: null, title: null, thumbnail: null });
    }
    return;
  }

  try {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

    if (YOUTUBE_API_KEY) {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoEmbeddable=true&maxResults=1&key=${YOUTUBE_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json() as any;

      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        const result = {
          videoId: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url,
        };
        videoCache.set(query, result);
        res.json(result);
        return;
      }
    }

    const geminiPrompt = `You are a helpful assistant that finds real YouTube educational videos.

For the topic: "${query}"

Find a real, existing YouTube video that covers this educational topic. Return ONLY a raw JSON object with no markdown, no explanation:
{"videoId":"VIDEO_ID_HERE","title":"Video Title Here","thumbnail":"https://img.youtube.com/vi/VIDEO_ID_HERE/mqdefault.jpg"}

Rules:
- Use a REAL YouTube video ID (11 characters, letters/numbers/hyphens/underscores)
- The video must be genuinely educational and about the topic
- Do NOT use "dQw4w9WgXcQ" which is a music video
- Known reliable educational channels: Khan Academy, freeCodeCamp, 3Blue1Brown, Fireship, Traversy Media, MIT OpenCourseWare, Crash Course, CS50, The Coding Train
- Only return the JSON, nothing else`;

    const geminiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: geminiPrompt }] }],
      config: { maxOutputTokens: 300 },
    });

    const text = (geminiResponse.text ?? "").trim();
    const parsed = extractJson(text);

    if (
      parsed &&
      typeof parsed.videoId === "string" &&
      parsed.videoId.length >= 8 &&
      parsed.videoId !== "dQw4w9WgXcQ" &&
      parsed.videoId !== "VIDEO_ID_HERE"
    ) {
      const result = {
        videoId: parsed.videoId as string,
        title: (parsed.title as string) || query,
        thumbnail: `https://img.youtube.com/vi/${parsed.videoId}/mqdefault.jpg`,
      };
      videoCache.set(query, result);
      res.json(result);
    } else {
      videoCache.set(query, null);
      res.json({ videoId: null, title: null, thumbnail: null });
    }
  } catch (err) {
    console.error("Error searching YouTube:", err);
    res.json({ videoId: null, title: null, thumbnail: null });
  }
});

export default router;
