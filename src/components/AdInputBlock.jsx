"use client";

import { Trash2, X } from "lucide-react";

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

export default function AdInputBlock({ title, value, onChange, onRemove }) {
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
    <section className="panel" style={{ display: "grid", gap: 24 }}>
      <div className="section-head" style={{ marginBottom: 0 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <p className="eyebrow">{title}</p>
          <h2 className="h3">The ad brief</h2>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span className={`chip${hasCopy ? " chip--on" : ""}`}>Copy</span>
          <span className={`chip${hasCreative ? " chip--on" : ""}`}>Creative</span>
          <span className={`chip${hasLink ? " chip--on" : ""}`}>Link</span>
          {onRemove ? (
            <button type="button" onClick={onRemove} className="icon-btn" aria-label={`Remove ${title}`}>
              <Trash2 size={15} />
            </button>
          ) : null}
        </div>
      </div>

      <label className="field">
        <span className="field__label"><span>Ad copy</span><span style={{ color: "var(--ink3)" }}>{copyLength} chars</span></span>
        <textarea
          value={value.adCopy}
          onChange={(event) => patch({ adCopy: event.target.value, error: "" })}
          placeholder="Paste the exact ad copy your audience will see: hook, body, offer, CTA."
          className="textarea"
        />
      </label>

      <label className="field">
        <span className="field__label">Ad / post link</span>
        <input
          value={value.postLink}
          onChange={(event) => handlePostLinkChange(event.target.value)}
          placeholder="Facebook, Instagram, TikTok, LinkedIn or Google ad link"
          className="input"
          inputMode="url"
        />
        {value.detectedPlatform ? (
          <p className="hint hint--ok">PLATFORM DETECTED · {value.detectedPlatform.toUpperCase()}</p>
        ) : value.postLink.trim() && !value.error ? (
          <p className="hint">No supported platform detected from this link. You can still pick the platform yourself.</p>
        ) : null}
      </label>

      <div className="field">
        <span className="field__label">Creative</span>
        {value.creativePreview ? (
          <div className="preview">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 500, overflowWrap: "anywhere" }}>{value.creativeFilename}</p>
                <p className="meta" style={{ marginTop: 4 }}>
                  {value.creativeType === "video"
                    ? `VIDEO HOOK AUDIT READY${value.videoDuration ? ` · ${value.videoDuration}S` : ""}${value.videoFrames?.length ? ` · ${value.videoFrames.length} KEY FRAMES` : ""}`
                    : "IMAGE · AI IMAGE ANALYSIS ON PLUS AND PRO"}
                </p>
              </div>
              <button type="button" onClick={clearCreative} className="icon-btn" aria-label="Remove creative">
                <X size={15} />
              </button>
            </div>
            {value.creativeType === "image" ? (
              <img src={value.creativePreview} alt="Uploaded creative preview" />
            ) : (
              <video src={value.creativePreview} controls onLoadedMetadata={handleVideoMetadata} />
            )}
            {value.creativeType === "video" ? (
              <p className="hint">Video Hook Audit reads sampled key frames from the opening. It does not analyze the full video, audio or transcript.</p>
            ) : null}
          </div>
        ) : (
          <label className="dropzone">
            <span className="dropzone__inner">
              <span style={{ fontWeight: 500 }}>Add an image or video creative</span>
              <span className="hint">JPG, PNG, WEBP, MP4, MOV or WEBM, up to 25MB.</span>
              <span className="btn btn--primary" style={{ marginTop: 6 }}>Choose file</span>
            </span>
            <input type="file" accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" hidden onChange={(event) => handleFile(event.target.files?.[0])} />
          </label>
        )}
      </div>

      {value.error ? <p className="notice notice--error">{value.error}</p> : null}
    </section>
  );
}
