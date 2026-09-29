import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";

const execFileAsync = promisify(execFile);

// Helper to locate executable binaries on system or common locations
async function findBinary(name: string, candidatePaths: string[]): Promise<string> {
  for (const p of candidatePaths) {
    try {
      await fs.access(p);
      return p;
    } catch {}
  }
  return name;
}

async function getYtDlpPath(): Promise<string> {
  return findBinary("yt-dlp", [
    "/Users/asrithcheepurupalli/.local/bin/yt-dlp",
    "/opt/homebrew/bin/yt-dlp",
    "/usr/local/bin/yt-dlp",
    "/usr/bin/yt-dlp",
  ]);
}

async function getFfmpegPath(): Promise<string> {
  return findBinary("ffmpeg", [
    "/opt/homebrew/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "/usr/bin/ffmpeg",
  ]);
}

async function getFfprobePath(): Promise<string> {
  return findBinary("ffprobe", [
    "/opt/homebrew/bin/ffprobe",
    "/usr/local/bin/ffprobe",
    "/usr/bin/ffprobe",
  ]);
}

export interface MediaExtractionResult {
  transcript: string;
  screenshots: string[];
  durationSeconds?: number;
}

/**
 * Direct Instagram Public Scraper & oEmbed API.
 * Uses official public oEmbed endpoint first for 100% reliable captions and posters,
 * with captioned HTML embed fallback.
 */
export async function fetchInstagramEmbed(url: string): Promise<{ text: string; images: string[] }> {
  try {
    const cleanUrl = url.split("?")[0].replace(/\/$/, "");
    const match = cleanUrl.match(/\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i);
    if (!match || !match[1]) return { text: "", images: [] };

    const shortcode = match[1];
    let extractedText = "";
    const images: string[] = [];

    // 1. Official Instagram oEmbed API (fastest, zero auth, works on Reels, Carousels, and Posts)
    try {
      const oembedUrl = `https://www.instagram.com/api/v1/oembed/?url=https://www.instagram.com/p/${shortcode}/`;
      const oembedRes = await fetch(oembedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(6000),
      });

      if (oembedRes.ok) {
        const data = await oembedRes.json();
        if (data.title && data.title.trim().length > 5) {
          extractedText = data.title.trim();
        }
        if (data.thumbnail_url) {
          images.push(data.thumbnail_url);
        }
      }
    } catch (err) {
      console.warn("[made. desk] Instagram oEmbed API warning:", err);
    }

    // 2. If we already have the text from oEmbed, also try to fetch extra carousel images if needed
    const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
    try {
      const res = await fetch(embedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const html = await res.text();

        // Extract embedded media poster
        const imgMatch = html.match(/class="EmbeddedMediaImage"[^>]*src="([^"]+)"/i) || html.match(/src="([^"]+)"[^>]*class="EmbeddedMediaImage"/i);
        if (imgMatch && imgMatch[1]) {
          const cleanSrc = imgMatch[1].replace(/&amp;/g, "&");
          if (!images.includes(cleanSrc)) images.push(cleanSrc);
        }

        // Look for CDN image URLs
        const cdnMatches = html.matchAll(/https:\/\/[^"'\s<>]+(?:cdninstagram\.com|fbcdn\.net)[^"'\s<>]+/g);
        for (const m of cdnMatches) {
          const src = m[0].replace(/&amp;/g, "&").replace(/\\u0026/g, "&");
          if (
            !src.includes("static.cdninstagram.com") &&
            !src.includes("rsrc.php") &&
            !src.includes("s150x150") &&
            !src.includes("profile_pic") &&
            !src.includes("favicon") &&
            !src.includes("emoji") &&
            !images.includes(src)
          ) {
            images.push(src);
          }
        }

        // If oEmbed didn't yield text, extract from HTML caption
        if (!extractedText) {
          const captionMatch = html.match(/<div class="Caption"[^>]*>([\s\S]*?)<\/div>/i);
          if (captionMatch && captionMatch[1]) {
            const rawCaption = captionMatch[1]
              .replace(/<br\s*\/?>/gi, "\n")
              .replace(/<a[^>]*>(.*?)<\/a>/gi, "$1")
              .replace(/<[^>]+>/g, "")
              .replace(/View all \d+ comments.*/gi, "")
              .trim();

            if (rawCaption.length > 5) {
              extractedText = rawCaption;
            }
          }
        }
      }
    } catch (embedErr) {
      // Ignored if oEmbed already succeeded
    }

    if (extractedText || images.length > 0) {
      return {
        text: extractedText,
        images: images.slice(0, 6),
      };
    }
  } catch (err) {
    console.warn("[made. desk] Instagram extractor failed:", err);
  }
  return { text: "", images: [] };
}

/**
 * Universal web reader using Jina Reader.
 */
export async function fetchWebUrlContent(url: string): Promise<{ text: string; images: string[] }> {
  try {
    const cleanUrl = url.split("?")[0].replace(/\/$/, "");
    const jinaUrl = `https://r.jina.ai/${cleanUrl}`;
    const response = await fetch(jinaUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "text/plain, text/markdown",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const markdown = await response.text();
      const images: string[] = [];
      const imgRegex = /!\[.*?\]\((https?:\/\/[^\s\)]+)\)/g;
      let match;
      while ((match = imgRegex.exec(markdown)) !== null) {
        const src = match[1];
        if (!src.includes("s150x150") && !src.includes("profile_pic") && !src.includes("emoji")) {
          images.push(src);
        }
      }

      const cleanText = markdown
        .replace(/\[Log In\].*/g, "")
        .replace(/\[Sign Up\].*/g, "")
        .replace(/Sign up for Instagram.*/g, "")
        .trim();

      return {
        text: cleanText || markdown,
        images: images.slice(0, 5),
      };
    }
  } catch (err) {
    console.warn("[made. desk] Web URL reader failed:", err);
  }
  return { text: "", images: [] };
}

export async function extractMediaFromUrl(
  url: string,
  captureId: string
): Promise<MediaExtractionResult> {
  const cleanUrl = url.split("?")[0].replace(/\/$/, "");
  let transcript = "";
  let screenshots: string[] = [];
  let durationSeconds: number | undefined = undefined;

  const isInstagram = url.includes("instagram.com") || url.includes("/p/") || url.includes("/reel/");

  // 1. If Instagram, immediately fetch the direct public embed (fastest and most reliable)
  if (isInstagram) {
    const embedData = await fetchInstagramEmbed(cleanUrl);
    if (embedData.text && embedData.text.length > 10) {
      transcript = embedData.text;
    }
    if (embedData.images.length > 0) {
      screenshots = embedData.images;
    }
  }

  // 2. If transcript is still empty, try Jina web reader
  if (!transcript || transcript.trim().length === 0) {
    const webData = await fetchWebUrlContent(cleanUrl);
    if (webData.text && webData.text.trim().length > 0) {
      transcript = webData.text;
    }
    if (screenshots.length === 0 && webData.images.length > 0) {
      screenshots = webData.images;
    }
  }

  // 3. If local binaries (yt-dlp + ffmpeg) are available, attempt local video & audio transcription
  if (!transcript || screenshots.length === 0) {
    const ytDlp = await getYtDlpPath();
    const ffmpeg = await getFfmpegPath();
    const ffprobe = await getFfprobePath();

    const tmpDir = path.join("/tmp", "made-desk-media", captureId);
    const publicDir = path.join(process.cwd(), "public", "captures", captureId);

    try {
      await fs.mkdir(tmpDir, { recursive: true });
      await fs.mkdir(publicDir, { recursive: true }).catch(() => {});

      const videoPattern = path.join(tmpDir, "video.%(ext)s");
      const audioPath = path.join(tmpDir, "audio.mp3");

      await execFileAsync(ytDlp, [
        "-f",
        "b[ext=mp4]/b/best",
        "-o",
        videoPattern,
        "--no-playlist",
        "--no-warnings",
        "--quiet",
        url,
      ]);

      const files = await fs.readdir(tmpDir);
      const videoFile = files.find((f) => f.startsWith("video.") && !f.endsWith(".mp3"));

      if (videoFile) {
        const videoPath = path.join(tmpDir, videoFile);

        // Duration
        let duration = 30;
        try {
          const { stdout } = await execFileAsync(ffprobe, [
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            videoPath,
          ]);
          const parsed = parseFloat(stdout.trim());
          if (!isNaN(parsed) && parsed > 0) duration = parsed;
        } catch {}
        durationSeconds = Math.round(duration);

        // Audio extract
        try {
          await execFileAsync(ffmpeg, [
            "-y",
            "-i",
            videoPath,
            "-vn",
            "-ar",
            "44100",
            "-ac",
            "2",
            "-b:a",
            "128k",
            audioPath,
          ]);
        } catch {}

        // Keyframes extract
        const frameRate = Math.max(1, Math.round(duration / 4));
        const screenshotPattern = path.join(publicDir, "frame_%02d.jpg");
        try {
          await execFileAsync(ffmpeg, [
            "-y",
            "-i",
            videoPath,
            "-vf",
            `fps=1/${frameRate},scale=720:-1`,
            "-vframes",
            "5",
            screenshotPattern,
          ]);
        } catch {}

        const publicFiles = await fs.readdir(publicDir).catch(() => []);
        const localShots = publicFiles
          .filter((f) => f.endsWith(".jpg") || f.endsWith(".png"))
          .sort()
          .map((f) => `/captures/${captureId}/${f}`);

        if (localShots.length > 0) {
          screenshots = localShots;
        }

        // Gemini audio transcription
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (apiKey && (await fs.access(audioPath).then(() => true).catch(() => false))) {
          const audioBuffer = await fs.readFile(audioPath);
          const base64Audio = audioBuffer.toString("base64");
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Transcribe all spoken dialogue and tactical advice in this audio clip verbatim. Do not summarize.`,
                  },
                  {
                    inlineData: {
                      mimeType: "audio/mp3",
                      data: base64Audio,
                    },
                  },
                ],
              },
            ],
            config: { temperature: 0.1 },
          });
          if (response.text && response.text.trim().length > 0) {
            transcript = response.text.trim();
          }
        }
      }
    } catch (localErr) {
      // Ignore local ffmpeg errors if we already got web data
    } finally {
      try {
        await fs.rm(tmpDir, { recursive: true, force: true });
      } catch {}
    }
  }

  return {
    transcript,
    screenshots,
    durationSeconds,
  };
}
