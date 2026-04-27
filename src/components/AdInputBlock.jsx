"use client";

import { BadgeCheck, ImagePlus, Link2, X } from "lucide-react";

const acceptedTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "video/webm"];
const maxBytes = 25 * 1024 * 1024;

export const emptyAdInput = {
  adCopy: "",
  postLink: "",
  detectedPlatform: "",
  creativeFilename: "",
  creativeType: "none",
  creativePreview: "",
  imageData: "",
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
    imageData: ad.creativeType === "image" ? ad.imageData : "",
  };
}

export default function AdInputBlock({ title, value, onChange }) {
  function patch(next) {
    onChange({ ...value, ...next });
  }

  function clearCreative() {
    if (value.creativePreview) URL.revokeObjectURL(value.creativePreview);
    patch({ creativeFilename: "", creativeType: "none", creativePreview: "", imageData: "", error: "" });
  }

  function handleFile(file) {
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

    if (creativeType === "image") {
      const reader = new FileReader();
      reader.onload = () => patch({ creativeFilename: file.name, creativeType, creativePreview: preview, imageData: String(reader.result || ""), error: "" });
      reader.readAsDataURL(file);
      return;
    }

    patch({ creativeFilename: file.name, creativeType, creativePreview: preview, imageData: "", error: "" });
  }

  function handlePostLinkChange(nextValue) {
    const detectedPlatform = detectPlatformFromUrl(nextValue);
    patch({ postLink: nextValue, detectedPlatform, error: "" });
  }

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
      <h2 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-slate-400">{title}</h2>

      <label className="mb-4 block">
        <span className="mb-2 block text-sm font-bold text-slate-200">Ad Copy</span>
        <textarea
          value={value.adCopy}
          onChange={(event) => patch({ adCopy: event.target.value, error: "" })}
          placeholder="Paste your ad copy..."
          className="min-h-40 w-full resize-y rounded-lg border border-white/10 bg-slate-950 p-4 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60"
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-2 block text-sm font-bold text-slate-200">Ad Post Link</span>
        <div className="relative">
          <Link2 className="absolute left-3 top-3.5 text-slate-500" size={16} />
          <input
            value={value.postLink}
            onChange={(event) => handlePostLinkChange(event.target.value)}
            placeholder="Paste Facebook, Instagram, TikTok, LinkedIn, or Google ad link"
            className="w-full rounded-lg border border-white/10 bg-slate-950 py-3 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60"
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

      <div>
        <span className="mb-2 block text-sm font-bold text-slate-200">Ad Creative Upload</span>
        {value.creativePreview ? (
          <div className="rounded-lg border border-white/10 bg-slate-950 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-white">{value.creativeFilename}</p>
                <p className="text-xs text-slate-500">
                  {value.creativeType === "video" ? "Video preview only. Deep video analysis is not available yet." : "Preview only on Free. AI image analysis is included in Plus."}
                </p>
              </div>
              <button type="button" onClick={clearCreative} className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10" aria-label="Remove creative">
                <X size={15} />
              </button>
            </div>
            {value.creativeType === "image" ? (
              <img src={value.creativePreview} alt="" className="max-h-64 w-full rounded-lg object-contain" />
            ) : (
              <video src={value.creativePreview} controls className="max-h-64 w-full rounded-lg" />
            )}
          </div>
        ) : (
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-dashed border-white/15 bg-slate-950 p-4 text-sm text-slate-400 transition hover:border-cyan-300/40">
            <span className="flex items-center gap-3">
              <ImagePlus size={18} />
              JPG, PNG, WEBP, MP4, MOV, WEBM up to 25MB · Images preview only on Free
            </span>
            <span className="rounded-md bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">Choose</span>
            <input type="file" accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
          </label>
        )}
      </div>

      {value.error ? <p className="mt-3 rounded-lg border border-rose-400/25 bg-rose-400/10 p-3 text-sm text-rose-200">{value.error}</p> : null}
    </section>
  );
}
