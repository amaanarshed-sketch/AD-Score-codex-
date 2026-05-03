export const PLAN_CONFIG = {
  free: {
    name: "Free",
    monthlyCredits: 5,
    paid: false,
    creativeAi: false,
    videoAudit: false,
  },
  plus: {
    name: "Plus",
    monthlyCredits: 150,
    paid: true,
    creativeAi: true,
    videoAudit: true,
  },
  pro: {
    name: "Pro",
    monthlyCredits: 750,
    paid: true,
    creativeAi: true,
    videoAudit: true,
  },
};

export const CREDIT_COSTS = {
  text: 1,
  image: 2,
  video: 8,
};

export function normalizePlan(plan) {
  return PLAN_CONFIG[plan] ? plan : "free";
}

export function planFromVariantId(variantId) {
  const id = String(variantId || "");
  if (id && id === String(process.env.LEMONSQUEEZY_PRO_VARIANT_ID || "")) return "pro";
  if (id && id === String(process.env.LEMONSQUEEZY_PLUS_VARIANT_ID || "")) return "plus";
  return "free";
}

export function creditsForAd(ad = {}) {
  if (ad.creativeType === "video") return CREDIT_COSTS.video;
  if (ad.creativeType === "image") return CREDIT_COSTS.image;
  return CREDIT_COSTS.text;
}

export function creditsForRequest({ compare = false, ad, ads = [] } = {}) {
  if (compare) return ads.reduce((sum, item) => sum + creditsForAd(item), 0);
  return creditsForAd(ad);
}

export function canUseCreativeAi(plan) {
  return PLAN_CONFIG[normalizePlan(plan)].creativeAi;
}

export function canUseVideoAudit(plan) {
  return PLAN_CONFIG[normalizePlan(plan)].videoAudit;
}
