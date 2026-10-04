export const DRAFT_KEY = "marketing-draft";
export function loadMarketingDraft<T>(fallback: T): T { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null") || fallback; } catch { return fallback; } }
export function saveMarketingDraft<T>(draft: T) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* storage may be unavailable */ } }
export function clearMarketingDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch { /* storage may be unavailable */ } }
