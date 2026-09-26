import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { hasGemini } from "@/lib/env";

const execFileAsync = promisify(execFile);

// Helper to locate executable binaries
async function findBinary(name: string, candidatePaths: string[]): Promise<string> {
  for (const p of candidatePaths) {
    try {
      await fs.access(p);
      return p;
    } catch {}
  }
  return name; // fallback to PATH
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

export async function extractMediaFromUrl(
  url: string,
  captureId: string
): Promise<MediaExtractionResult> {
  const ytDlp = await getYtDlpPath();
  const ffmpeg = await getFfmpegPath();
  const ffprobe = await getFfprobePath();

  const tmpDir = path.join("/tmp", "made-desk-media", captureId);
  const publicDir = path.join(process.cwd(), "public", "captures", captureId);

  await fs.mkdir(tmpDir, { recursive: true });
  await fs.mkdir(publicDir, { recursive: true });

  const videoPattern = path.join(tmpDir, "video.%(ext)s");
  const audioPath = path.join(tmpDir, "audio.mp3");

  console.log(`[made. desk] Downloading media from ${url} to ${tmpDir}...`);

  // 1. Download video with yt-dlp
  try {
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
  } catch (dlError: any) {
    console.warn(`[made. desk] yt-dlp download failed or URL not directly downloadable:`, dlError.message);
    return {
      transcript: "",
      screenshots: [],
    };
  }

  // Find the downloaded video file
  const files = await fs.readdir(tmpDir);
  const videoFile = files.find((f) => f.startsWith("video.") && !f.endsWith(".mp3"));

  if (!videoFile) {
    console.warn("[made. desk] No video file found after yt-dlp download");
    return { transcript: "", screenshots: [] };
  }

  const videoPath = path.join(tmpDir, videoFile);

  // 2. Extract Duration via ffprobe
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
    if (!isNaN(parsed) && parsed > 0) {
      duration = parsed;
    }
  } catch {}

  // 3. Extract MP3 audio with ffmpeg
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
  } catch (audioErr: any) {
    console.warn("[made. desk] Audio extraction with ffmpeg failed:", audioErr.message);
  }

  // 4. Extract 3 to 5 keyframe screenshots
  // Calculate interval to get ~4 evenly spaced screenshots across the duration
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
  } catch (frameErr: any) {
    console.warn("[made. desk] Screenshot extraction with ffmpeg failed:", frameErr.message);
  }

  // Gather generated screenshots
  const publicFiles = await fs.readdir(publicDir);
  const screenshots = publicFiles
    .filter((f) => f.endsWith(".jpg") || f.endsWith(".png"))
    .sort()
    .map((f) => `/captures/${captureId}/${f}`);

  // 5. Transcribe Audio with Gemini 2.5 Flash
  let transcript = "";
  try {
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
                text: `You are an expert audio transcriptionist for made. by ac agency operating system.
Transcribe all spoken dialogue and narration in this audio clip verbatim.
Ensure every step, workflow, checklist item, pricing guideline, or advice is captured clearly.
Do not summarize. Output the verbatim transcript text.`,
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
        config: {
          temperature: 0.1,
        },
      });

      transcript = response.text?.trim() || "";
    }
  } catch (transcribeErr: any) {
    console.warn("[made. desk] Gemini audio transcription error:", transcribeErr.message);
  }

  // Clean up temporary files in /tmp
  try {
    await fs.rm(tmpDir, { recursive: true, force: true });
  } catch {}

  return {
    transcript,
    screenshots,
    durationSeconds: Math.round(duration),
  };
}
