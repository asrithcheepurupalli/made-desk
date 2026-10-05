import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { llm, aiProvider } from "@/lib/ai/llm";

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
  /** Combined, labelled text handed to the AI: caption, spoken transcript, on-screen text */
  transcript: string;
  caption: string;
  spoken: string;
  onScreenText: string;
  screenshots: string[];
  durationSeconds?: number;
  quality: "full" | "caption_only" | "none";
  note?: string;
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

/**
 * Instagram CDN URLs expire and block hotlinking, so we download each image
 * server-side and inline it as a data URI. It then persists with the capture.
 */
export async function downloadImageAsDataUri(src: string): Promise<string | null> {
  if (src.startsWith("data:")) return src;
  if (src.startsWith("/captures/")) {
    try {
      const buf = await fs.readFile(path.join(process.cwd(), "public", src));
      return `data:image/jpeg;base64,${buf.toString("base64")}`;
    } catch {
      return null;
    }
  }
  if (src.startsWith("/")) return null;
  try {
    const res = await fetch(src, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/jpeg,image/*;q=0.8",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > 600_000) return null;
    const type = (res.headers.get("content-type") || "image/jpeg").split(";")[0];
    if (!type.startsWith("image/")) return null;
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function persistImages(images: string[], max = 4): Promise<string[]> {
  const out = await Promise.all(images.slice(0, max).map(downloadImageAsDataUri));
  return out.filter((x): x is string => Boolean(x));
}

const MAX_INLINE_VIDEO_BYTES = 18 * 1024 * 1024;

/** Locate yt-dlp, or fetch the standalone Linux build into /tmp (serverless has none). */
async function ensureYtDlp(): Promise<string | null> {
  const found = await getYtDlpPath();
  if (found !== "yt-dlp") return found;
  try {
    await execFileAsync("yt-dlp", ["--version"], { timeout: 5000 });
    return "yt-dlp";
  } catch {}

  if (process.platform !== "linux") return null;
  const target = "/tmp/yt-dlp";
  try {
    await fs.access(target);
    return target;
  } catch {}
  try {
    const res = await fetch("https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux", {
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    await fs.writeFile(target, Buffer.from(await res.arrayBuffer()));
    await fs.chmod(target, 0o755);
    return target;
  } catch (err) {
    console.warn("[made. desk] Could not fetch yt-dlp:", err);
    return null;
  }
}

/** Ask Gemini to transcribe speech and read on-screen text from a video or audio file. */
async function transcribeWithGemini(
  buf: Buffer,
  mimeType: string
): Promise<{ spoken: string; onScreen: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                "Transcribe every word spoken in this media verbatim, do not summarize or add anything. " +
                "Then list ALL on-screen text exactly as shown, in order, one line each. " +
                "The video shows text slides that change every few seconds, so capture every distinct slide, including small captions, examples, lists, and labels. " +
                "If there is no speech or no on-screen text, write NONE for that section. " +
                "Use exactly this format:\nSPOKEN:\n...\nON-SCREEN TEXT:\n...",
            },
            { inlineData: { mimeType, data: buf.toString("base64") } },
          ],
        },
      ],
      config: { temperature: 0, thinkingConfig: { thinkingBudget: 4096 } },
    });
    const text = (response.text || "").trim();
    if (!text) return null;
    const spokenMatch = text.match(/SPOKEN:\s*([\s\S]*?)(?:\n\s*ON-SCREEN TEXT:|$)/i);
    const screenMatch = text.match(/ON-SCREEN TEXT:\s*([\s\S]*)$/i);
    const clean = (v?: string) => {
      const t = (v || "").trim();
      return /^NONE\.?$/i.test(t) ? "" : t;
    };
    return { spoken: clean(spokenMatch?.[1]), onScreen: clean(screenMatch?.[1]) };
  } catch (err) {
    console.warn("[made. desk] Gemini transcription failed:", err);
    return null;
  }
}

/** Local speech-to-text: OpenAI Whisper on this machine. Free, private, no key. */
async function getWhisperPath(): Promise<string | null> {
  const found = await findBinary("whisper", [
    process.env.WHISPER_BIN || "",
    "/Applications/Anaconda/anaconda3/bin/whisper",
    "/opt/homebrew/bin/whisper",
    "/usr/local/bin/whisper",
    "/Users/asrithcheepurupalli/.local/bin/whisper",
  ].filter(Boolean));
  if (found !== "whisper") return found;
  return execFileAsync("whisper", ["--help"], { timeout: 8000 }).then(() => "whisper", () => null);
}

async function transcribeSpeechLocally(videoPath: string, ffmpeg: string, dir: string): Promise<string> {
  const whisper = await getWhisperPath();
  if (!whisper) return "";
  const wav = path.join(dir, "speech.wav");
  try {
    await execFileAsync(ffmpeg, ["-y", "-i", videoPath, "-vn", "-ac", "1", "-ar", "16000", wav], { timeout: 60000 });
    // "base" is ~5x faster than "small" with the same accuracy on clear speech (set WHISPER_MODEL=small for noisy audio)
    const model = process.env.WHISPER_MODEL || "base";
    await execFileAsync(whisper, [wav, "--model", model, "--fp16", "False", "--output_format", "txt", "--output_dir", dir, "--verbose", "False"], {
      timeout: 5 * 60 * 1000,
      maxBuffer: 20 * 1024 * 1024,
    });
    return (await fs.readFile(path.join(dir, "speech.txt"), "utf-8")).trim();
  } catch (err) {
    console.warn("[made. desk] Local Whisper failed:", err instanceof Error ? err.message.slice(0, 160) : err);
    return "";
  }
}

const OCR_PROMPT =
  "These are frames from one short video, in time order. List ALL on-screen text exactly as shown, in reading order, one line per distinct piece of text. " +
  "Text that repeats across consecutive frames is listed once. Include slide headings, bullet lists, example messages, captions and labels. " +
  "Ignore app interface chrome, usernames and watermarks. If there is no readable text, write NONE. Output only the text, no commentary.";

async function getTesseractPath(): Promise<string | null> {
  const found = await findBinary("tesseract", [process.env.TESSERACT_BIN || "", "/opt/homebrew/bin/tesseract", "/usr/local/bin/tesseract", "/usr/bin/tesseract"].filter(Boolean));
  if (found !== "tesseract") return found;
  return execFileAsync("tesseract", ["--version"], { timeout: 5000 }).then(() => "tesseract", () => null);
}

/** Free, offline OCR: read each frame with Tesseract and keep each distinct line once. */
async function ocrFramesLocally(dir: string, names: string[]): Promise<string> {
  const tess = await getTesseractPath();
  if (!tess) return "";
  const seen = new Set<string>();
  const out: string[] = [];
  const norm = (l: string) => l.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const readOne = async (f: string) => {
    try {
      // One thread each: several Tesseract runs in parallel otherwise starve each other (and Whisper)
      const { stdout } = await execFileAsync(tess, [f, "stdout", "--psm", "11"], {
        // Relative name from inside the folder: Tesseract/Leptonica cannot open absolute /tmp paths on macOS
        cwd: dir,
        timeout: 60000,
        maxBuffer: 4 * 1024 * 1024,
        env: { ...process.env, OMP_THREAD_LIMIT: "1" },
      });
      return stdout.split("\n").map((l) => l.trim());
    } catch {
      return [];
    }
  };
  // Four at a time
  const results: string[][] = new Array(names.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(4, names.length) }, async () => {
      while (i < names.length) {
        const n = i++;
        results[n] = await readOne(names[n]);
      }
    })
  );
  for (const lines of results) {
    for (const line of lines) {
      const key = norm(line);
      // Drop noise: very short lines and lines with almost no letters
      const letters = (line.match(/[A-Za-z]/g) || []).length;
      const clean = (line.match(/[A-Za-z0-9 .,'"!?:;&%$+\-]/g) || []).length;
      if (key.length < 4 || letters < 4 || clean / line.length < 0.8 || seen.has(key)) continue;
      // OCR garbage tends to be long strings with no real words in them
      const words = key.split(" ").filter((w) => w.length >= 3);
      const wordlike = words.filter((w) => w.length <= 15 && /[aeiouy]/.test(w)).length;
      if (!words.length || wordlike / words.length < 0.6 || /\bask gemini\b|\bhtm!?\b/.test(key)) continue;
      seen.add(key);
      out.push(line);
    }
  }
  return out.join("\n");
}

/** Pull evenly spaced frames and read their on-screen text. Local Tesseract first, a vision model as backup. */
async function readOnScreenText(videoPath: string, ffmpeg: string, dir: string, duration: number): Promise<{ text: string; frames: string[] }> {
  try {
    const every = Math.max(1.5, duration / 40);
    await execFileAsync(ffmpeg, ["-y", "-i", videoPath, "-vf", `fps=1/${every.toFixed(2)},scale=720:-2`, "-q:v", "4", "-frames:v", "40", path.join(dir, "ocr_%02d.jpg")], { timeout: 60000 });
    const names = (await fs.readdir(dir)).filter((f) => f.startsWith("ocr_")).sort();
    const frames: string[] = [];
    for (const f of names) frames.push(`data:image/jpeg;base64,${(await fs.readFile(path.join(dir, f))).toString("base64")}`);
    if (!frames.length) return { text: "", frames: [] };

    const local = await ocrFramesLocally(dir, names);
    if (local.trim().length > 20) return { text: local, frames };

    // Tesseract missing or found nothing: ask a vision-capable AI, if one is configured
    if (aiProvider() === "none") return { text: "", frames };
    try {
      const out = (await llm({ tier: "fast", maxTokens: 4000, images: frames.slice(0, 30), prompt: OCR_PROMPT, timeoutMs: 120000 })).trim();
      return { text: /^NONE\.?$/i.test(out) ? "" : out, frames };
    } catch {
      return { text: "", frames };
    }
  } catch (err) {
    console.warn("[made. desk] On-screen text read failed:", err instanceof Error ? err.message.slice(0, 160) : err);
    return { text: "", frames: [] };
  }
}

export async function extractMediaFromUrl(
  url: string,
  captureId: string
): Promise<MediaExtractionResult> {
  const cleanUrl = url.split("?")[0].replace(/\/$/, "");
  const isInstagram = url.includes("instagram.com");
  let caption = "";
  let spoken = "";
  let onScreenText = "";
  let screenshots: string[] = [];
  let durationSeconds: number | undefined;
  const notes: string[] = [];

  // 1. Caption + cover image. This is only the post text, NOT the video content.
  if (isInstagram) {
    const embed = await fetchInstagramEmbed(cleanUrl);
    caption = embed.text;
    screenshots = embed.images;
  } else {
    // Articles and other pages: the page text is the content
    const web = await fetchWebUrlContent(cleanUrl);
    if (web.text.trim()) spoken = web.text.trim();
    screenshots = web.images;
  }

  // 2. The real content: download the video and transcribe speech + on-screen text
  if (isInstagram || /youtube\.com|youtu\.be|tiktok\.com/.test(url)) {
    const ytDlp = await ensureYtDlp();
    if (!ytDlp) {
      notes.push("Video downloader unavailable on this server.");
    } else {
      const tmpDir = path.join("/tmp", "made-desk-media", captureId);
      try {
        await fs.mkdir(tmpDir, { recursive: true });
        await execFileAsync(
          ytDlp,
          ["-f", "b[ext=mp4]/b/best", "-o", path.join(tmpDir, "video.%(ext)s"), "--no-playlist", "--no-warnings", "--quiet", cleanUrl],
          { timeout: 45000, maxBuffer: 10 * 1024 * 1024 }
        );
        const files = await fs.readdir(tmpDir);
        const videoFile = files.find((f) => f.startsWith("video."));
        if (!videoFile) {
          notes.push("No video found in this post (it may be an image carousel).");
        } else {
          const videoPath = path.join(tmpDir, videoFile);
          const ffmpeg = await getFfmpegPath();
          const ffprobe = await getFfprobePath();

          try {
            const { stdout } = await execFileAsync(
              ffprobe,
              ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", videoPath],
              { timeout: 10000 }
            );
            const d = parseFloat(stdout.trim());
            if (!isNaN(d) && d > 0) durationSeconds = Math.round(d);
          } catch {}

          const haveFfmpeg = await execFileAsync(ffmpeg, ["-version"], { timeout: 5000 }).then(() => true, () => false);
          let spokenOut = "";
          let screenOut = "";

          if (haveFfmpeg) {
            // Speech (local Whisper) and on-screen text (vision) at the same time
            const [speech, screen] = await Promise.all([
              transcribeSpeechLocally(videoPath, ffmpeg, tmpDir),
              readOnScreenText(videoPath, ffmpeg, tmpDir, durationSeconds || 30),
            ]);
            spokenOut = speech;
            screenOut = screen.text;
            if (screen.frames.length) {
              // Four evenly spaced frames for the card gallery
              const step = Math.max(1, Math.floor(screen.frames.length / 4));
              screenshots = screen.frames.filter((_, i) => i % step === 0).slice(0, 4);
            }
          }

          // No local Whisper or ffmpeg: Gemini can still hear and watch the video if it is the configured provider
          if (!spokenOut && !screenOut && aiProvider() === "gemini") {
            const stat = await fs.stat(videoPath);
            if (stat.size <= MAX_INLINE_VIDEO_BYTES) {
              const g = await transcribeWithGemini(await fs.readFile(videoPath), "video/mp4");
              if (g) {
                spokenOut = g.spoken;
                screenOut = g.onScreen;
              }
            }
          }

          spoken = spokenOut;
          onScreenText = screenOut;
          if (!spoken && !onScreenText) {
            notes.push(
              haveFfmpeg
                ? "Could not read the video: Whisper is not installed or no AI key is set."
                : "This machine has no ffmpeg, so the video could not be transcribed (it only works when the desk runs on your Mac)."
            );
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        notes.push(
          /login|rate-limit|429|403|unavailable/i.test(msg)
            ? "Instagram blocked the video download from this server."
            : "Could not download the video."
        );
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      }
    }
  }

  // 3. Inline images so they never expire or get hotlink-blocked
  screenshots = await persistImages(screenshots);

  // A long caption (a written list or post) is itself the content, not just a hook
  const substantiveCaption = caption.trim().length >= 400;
  const hasReal = Boolean(spoken.trim() || onScreenText.trim() || substantiveCaption);
  const parts: string[] = [];
  if (caption.trim()) parts.push(`CAPTION:\n${caption.trim()}`);
  if (spoken.trim()) parts.push(`${isInstagram || /youtu|tiktok/.test(url) ? "SPOKEN TRANSCRIPT" : "PAGE TEXT"}:\n${spoken.trim()}`);
  if (onScreenText.trim()) parts.push(`ON-SCREEN TEXT (read by OCR, so some lines may be garbled: ignore garbage, never guess what it meant):\n${onScreenText.trim()}`);

  return {
    transcript: parts.join("\n\n"),
    caption,
    spoken,
    onScreenText,
    screenshots,
    durationSeconds,
    quality: hasReal ? "full" : caption.trim() ? "caption_only" : "none",
    note: hasReal ? undefined : notes[0],
  };
}
