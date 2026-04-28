const historyKey = "adnex:analysis-history";
const legacyHistoryKey = "adscore:analysis-history";

export function getAnalysisHistory() {
  if (typeof window === "undefined") return [];
  try {
    const current = localStorage.getItem(historyKey);
    const legacy = localStorage.getItem(legacyHistoryKey);
    if (!current && legacy) localStorage.setItem(historyKey, legacy);
    const stored = JSON.parse(current || legacy || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

export function saveAnalysisHistory(item) {
  if (typeof window === "undefined") return;
  const history = getAnalysisHistory();
  const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const next = [{ id, createdAt: new Date().toISOString(), ...item }, ...history].slice(0, 20);
  localStorage.setItem(historyKey, JSON.stringify(next));
}
