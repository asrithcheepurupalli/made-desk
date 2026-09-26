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
 * Universal web content fetcher using Jina Reader.
 * Works for Instagram posts/reels, YouTube, Twitter/X, and any web article even in serverless environments.
 */
export async function fetchWebUrlContent(url: string): Promise<{ text: string; images: string[] }> {
  try {
    const jinaUrl = `https://r.jina.ai/${url.trim()}`;
    const response = await fetch(jinaUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "text/plain, text/markdown",
      },
      signal: AbortSignal.timeout(12000),
    });

    if (response.ok) {
      const markdown = await response.text();

      // Extract image links from markdown
      const images: string[] = [];
      const imgRegex = /!\[.*?\]\((https?:\/\/[^\s\)]+)\)/g;
      let match;
      while ((match = imgRegex.exec(markdown)) !== null) {
        const src = match[1];
        // Filter out small avatars and icons
        if (!src.includes("s150x150") && !src.includes("profile_pic") && !src.includes("emoji")) {
          images.push(src);
        }
      }

      // Filter clean text
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
    console.warn("[made. desk] Web URL reader fallback failed:", err);
  }
  return { text: "", images: [] };
}

export async function extractMediaFromUrl(
  url: string,
  captureId: string
): Promise<MediaExtractionResult> {
  const ytDlp = await getYtDlpPath();
  const ffmpeg = await getFfmpegPath();
  const ffprobe = await getFfprobePath();

  const tmpDir = path.join("/tmp", "made-desk-media", captureId);
  const publicDir = path.join(process.cwd(), "public", "captures", captureId);

  let transcript = "";
  let screenshots: string[] = [];
  let durationSeconds: number | undefined = undefined;

  // 1. Try local yt-dlp + ffmpeg pipeline
  try {
    await fs.mkdir(tmpDir, { recursive: true });
    await fs.mkdir(publicDir, { recursive: true });

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
      screenshots = publicFiles
        .filter((f) => f.endsWith(".jpg") || f.endsWith(".png"))
        .sort()
        .map((f) => `/captures/${captureId}/${f}`);

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
                  text: `Transcribe all spoken dialogue, narration, and tactical advice in this audio clip verbatim. Do not summarize.`,
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
        transcript = response.text?.trim() || "";
      }
    }
  } catch (localErr) {
    console.warn("[made. desk] Local media download failed, falling back to web reader:", localErr);
  } finally {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
  }

  // 2. If transcript is empty (or on cloud/serverless without yt-dlp, or blocked by Instagram login), use web reader
  if (!transcript || transcript.trim().length === 0) {
    console.log(`[made. desk] Running universal web reader on ${url}...`);
    const webData = await fetchWebUrlContent(url);
    if (webData.text && webData.text.trim().length > 0) {
      transcript = webData.text;
    }
    if (screenshots.length === 0 && webData.images.length > 0) {
      screenshots = webData.images;
    }
  }

  return {
    transcript,
    screenshots,
    durationSeconds,
  };
}
