"use client";

import { BadgeCheck, FileText, ImagePlus, Link2, UploadCloud, X } from "lucide-react";

const acceptedTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "video/webm"];
const maxBytes = 25 * 1024 * 1024;
const imageMaxSide = 1280;
const imageQuality = 0.72;
const maxVideoFrames = 4;

export const emptyAdInput = {
  adCopy: "",
  postLink: "",
  detectedPlatform: "",
  creativeFilename: "",
  creativeType: "none",
  creativePreview: "",
  videoDuration: 0,
  imageData: "",
  videoFrames: [],
  videoAnalysisMode: "none",
  videoFrameExtractionFailed: false,
  error: "",
};

function isUrl(value) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export function detectPlatformFromUrl(value) {
  if (!value.trim()) return "";
  if (!isUrl(value)) return "";
  const host = new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  if (host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.com" || host === "fb.watch" || host === "instagram.com" || host.endsWith(".instagram.com")) {
    return "Meta / Facebook / Instagram";
  }
  if (host === "tiktok.com" || host.endsWith(".tiktok.com") || host === "vm.tiktok.com") return "TikTok";
  if (host === "linkedin.com" || host.endsWith(".linkedin.com") || host === "lnkd.in") return "LinkedIn";
  if (host === "google.com" || host.endsWith(".google.com") || host === "googleadservices.com" || host.endsWith(".googleadservices.com") || host === "doubleclick.net" || host.endsWith(".doubleclick.net")) {
    return "Google Ads";
  }
  return "";
}

export function validateAdInput(ad) {
  if (!ad.adCopy.trim() && !ad.postLink.trim() && ad.creativeType === "none") return "Provide ad copy, a creative upload, or an ad/post link.";
  if (!isUrl(ad.postLink)) return "Enter a valid URL for the ad/post link.";
  return "";
}

export function apiAdPayload(ad, ad_id) {
  return {
    ad_id,
    adCopy: ad.adCopy,
    postLink: ad.postLink,
    detectedPlatform: ad.detectedPlatform,
    creativeType: ad.creativeType,
    creativeFilename: ad.creativeFilename,
    hasCreativePreview: Boolean(ad.creativePreview),
    videoDuration: ad.creativeType === "video" ? ad.videoDuration : 0,
    imageData: ad.creativeType === "image" ? ad.imageData : "",
    videoFrames: ad.creativeType === "video" ? ad.videoFrames || [] : [],
    videoAnalysisMode: ad.creativeType === "video" && ad.videoFrames?.length ? "sampled_key_frames" : "none",
    videoFrameExtractionFailed: Boolean(ad.videoFrameExtractionFailed),
  };
}

function canvasToJpeg(canvas) {
  return canvas.toDataURL("image/jpeg", imageQuality);
}

function scaledSize(width, height) {
  const scale = Math.min(1, imageMaxSide / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to read image."));
    image.src = src;
  });
}

async function compressImageFile(file) {
  const original = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read image."));
    reader.readAsDataURL(file);
  });
  const image = await loadImage(original);
  const size = scaledSize(image.naturalWidth || image.width, image.naturalHeight || image.height);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, size.width, size.height);
  return canvasToJpeg(canvas);
}

function waitForVideoEvent(video, eventName) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener(eventName, onEvent);
      video.removeEventListener("error", onError);
    };
    const onEvent = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Unable to read video."));
    };
    video.addEventListener(eventName, onEvent, { once: true });
    video.addEventListener("error", onError, { once: true });
  });
}

async function extractVideoFrames(src) {
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;
  video.src = src;
  await waitForVideoEvent(video, "loadedmetadata");
  const duration = Number(video.duration || 0);
  const width = video.videoWidth || 720;
  const height = video.videoHeight || 1280;
  const size = scaledSize(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 1;
  const finalTime = Math.max(0, safeDuration - 0.05);
  const midpoint = Math.max(0, safeDuration / 2);
  const candidates = [0, Math.min(1, finalTime), Math.min(3, finalTime), safeDuration >= 6 ? midpoint : finalTime];
  const times = [];
  for (const candidate of candidates) {
    const time = Math.min(Math.max(0, candidate), finalTime);
    const rounded = Number(time.toFixed(2));
    if (!times.some((item) => Math.abs(item - rounded) < 0.1)) times.push(rounded);
    if (times.length >= maxVideoFrames) break;
  }
  const frames = [];

  for (const time of times) {
    video.currentTime = time;
    await waitForVideoEvent(video, "seeked");
    context.drawImage(video, 0, 0, size.width, size.height);
    frames.push(canvasToJpeg(canvas));
  }

  return { frames, duration: Number.isFinite(duration) ? Math.round(duration) : 0 };
}

export default function AdInputBlock({ title, value, onChange }) {
  const copyLength = value.adCopy.trim().length;
  const hasCopy = copyLength > 0;
  const hasLink = value.postLink.trim().length > 0;
  const hasCreative = value.creativeType !== "none";

  function patch(next) {
    onChange({ ...value, ...next });
  }

  function clearCreative() {
    if (value.creativePreview) URL.revokeObjectURL(value.creativePreview);
    patch({ creativeFilename: "", creativeType: "none", creativePreview: "", videoDuration: 0, imageData: "", videoFrames: [], videoAnalysisMode: "none", videoFrameExtractionFailed: false, error: "" });
  }

  async function handleFile(file) {
    if (!file) return;
    if (!acceptedTypes.includes(file.type)) {
      patch({ error: "Unsupported file type. Use JPG, PNG, WEBP, MP4, MOV, or WEBM." });
      return;
    }
    if (file.size > maxBytes) {
      patch({ error: "File is too large. Keep uploads under 25MB for the MVP preview." });
      return;
    }

    if (value.creativePreview) URL.revokeObjectURL(value.creativePreview);
    const creativeType = file.type.startsWith("image/") ? "image" : "video";
    const preview = URL.createObjectURL(file);
    // TODO: Replace local object URLs with Supabase Storage URLs once storage is configured.

    try {
      if (creativeType === "image") {
        const imageData = await compressImageFile(file);
        patch({ creativeFilename: file.name, creativeType, creativePreview: preview, videoDuration: 0, imageData, videoFrames: [], videoAnalysisMode: "none", videoFrameExtractionFailed: false, error: "" });
        return;
      }

      const { frames, duration } = await extractVideoFrames(preview);
      patch({ creativeFilename: file.name, creativeType, creativePreview: preview, videoDuration: duration, imageData: "", videoFrames: frames, videoAnalysisMode: frames.length ? "sampled_key_frames" : "none", videoFrameExtractionFailed: false, error: "" });
    } catch {
      patch({ creativeFilename: file.name, creativeType, creativePreview: preview, videoDuration: 0, imageData: "", videoFrames: [], videoAnalysisMode: "none", videoFrameExtractionFailed: creativeType === "video", error: creativeType === "video" ? "Frame extraction failed, so this audit used limited video context." : "Preview loaded, but image compression failed. You can still submit with limited creative context." });
    }
  }

  function handleVideoMetadata(event) {
    const duration = Number(event.currentTarget.duration || 0);
    if (Number.isFinite(duration) && duration > 0) {
      patch({ videoDuration: Math.round(duration), videoAnalysisMode: value.videoFrames?.length ? "sampled_key_frames" : value.videoAnalysisMode });
    }
  }

  function handlePostLinkChange(nextValue) {
    const detectedPlatform = detectPlatformFromUrl(nextValue);
    patch({ postLink: nextValue, detectedPlatform, error: "" });
  }

  return (
    <section className="app-card workbench-card rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
      <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="app-eyebrow text-sm font-black uppercase tracking-[0.16em] text-slate-400">{title}</p>
          <h2 className="app-title mt-2 text-xl font-black tracking-tight text-white">Build the ad brief</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`app-status-pill rounded-full border px-3 py-1 text-xs font-black ${hasCopy ? "is-active border-white/20 bg-white text-black" : "border-white/10 bg-white/5 text-slate-400"}`}>Copy</span>
          <span className={`app-status-pill rounded-full border px-3 py-1 text-xs font-black ${hasCreative ? "is-active border-white/20 bg-white text-black" : "border-white/10 bg-white/5 text-slate-400"}`}>Creative</span>
          <span className={`app-status-pill rounded-full border px-3 py-1 text-xs font-black ${hasLink ? "is-active border-white/20 bg-white text-black" : "border-white/10 bg-white/5 text-slate-400"}`}>Link</span>
        </div>
      </div>

      <label className="app-input-panel input-panel mb-4 block rounded-2xl border border-white/10 bg-black/20 p-4 transition focus-within:border-white/20 focus-within:bg-white/[0.045]">
        <span className="app-label mb-2 flex items-center justify-between gap-3 text-sm font-bold text-slate-200">
          <span className="inline-flex items-center gap-2"><FileText size={15} /> Ad Copy</span>
          <span className="app-muted text-xs font-bold text-slate-500">{copyLength} chars</span>
        </span>
        <textarea
          value={value.adCopy}
          onChange={(event) => patch({ adCopy: event.target.value, error: "" })}
          placeholder="Paste the exact ad copy your audience will see. Hooks, body copy, offer, CTA..."
          className="app-control min-h-40 w-full resize-y rounded-xl border p-4 text-sm leading-6 outline-none transition"
        />
      </label>

      <label className="app-input-panel input-panel mb-4 block rounded-2xl border border-white/10 bg-black/20 p-4 transition focus-within:border-white/20 focus-within:bg-white/[0.045]">
        <span className="app-label mb-2 flex items-center gap-2 text-sm font-bold text-slate-200"><Link2 size={15} /> Ad Post Link</span>
        <div className="relative">
          <Link2 className="app-muted absolute left-3 top-3.5 text-slate-500" size={16} />
          <input
            value={value.postLink}
            onChange={(event) => handlePostLinkChange(event.target.value)}
            placeholder="Paste Facebook, Instagram, TikTok, LinkedIn, or Google ad link"
            className="app-control w-full rounded-xl border py-3 pl-10 pr-3 text-sm outline-none transition"
          />
        </div>
        {value.detectedPlatform ? (
          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-200">
            <BadgeCheck size={13} />
            Platform detected: {value.detectedPlatform}
          </div>
        ) : value.postLink.trim() && !value.error ? (
          <p className="mt-2 text-xs leading-5 text-slate-500">No supported platform detected from this link yet. You can still select the platform manually.</p>
        ) : null}
      </label>

      <div className="app-input-panel input-panel rounded-2xl border border-white/10 bg-black/20 p-4">
        <span className="app-label mb-2 flex items-center gap-2 text-sm font-bold text-slate-200"><ImagePlus size={15} /> Ad Creative Upload</span>
        {value.creativePreview ? (
          <div className="rounded-xl border border-white/10 bg-slate-950/80 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="app-title text-sm font-bold text-white">{value.creativeFilename}</p>
                <p className="app-muted text-xs text-slate-500">
                  {value.creativeType === "video"
                    ? `Video Hook Audit ready${value.videoDuration ? ` · ${value.videoDuration}s detected` : ""}${value.videoFrames?.length ? ` · ${value.videoFrames.length} sampled key frames` : ""}.`
                    : "Preview only on Free. AI image analysis is included in Plus."}
                </p>
              </div>
              <button type="button" onClick={clearCreative} className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10" aria-label="Remove creative">
                <X size={15} />
              </button>
            </div>
            {value.creativeType === "image" ? (
              <img src={value.creativePreview} alt="" className="max-h-72 w-full rounded-lg object-contain" />
            ) : (
              <>
                <video src={value.creativePreview} controls onLoadedMetadata={handleVideoMetadata} className="max-h-72 w-full rounded-lg" />
                <p className="app-muted mt-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-xs leading-5 text-slate-500">
                  Video Hook Audit uses sampled key frames to evaluate scroll-stop potential, visual clarity, and offer visibility. It does not analyze full video, audio, or transcripts yet.
                </p>
              </>
            )}
          </div>
        ) : (
          <label className="app-upload upload-dropzone flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 bg-slate-950/80 p-5 text-center text-sm text-slate-400 transition hover:border-white/25 hover:bg-white/[0.035]">
            <span className="app-icon-box flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
              <UploadCloud size={22} />
            </span>
            <span className="app-label font-bold text-slate-200">Drop in an image or video creative</span>
            <span className="app-muted max-w-md text-xs leading-5 text-slate-500">JPG, PNG, WEBP, MP4, MOV, WEBM up to 25MB. Video Hook Audit uses sampled key frames and does not analyze full video, audio, or transcripts yet.</span>
            <span className="app-upload-button rounded-full bg-white px-4 py-2 text-xs font-black text-black">Choose creative</span>
            <input type="file" accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
          </label>
        )}
      </div>

      {value.error ? <p className="mt-3 rounded-lg border border-rose-400/25 bg-rose-400/10 p-3 text-sm text-rose-200">{value.error}</p> : null}
    </section>
  );
}
