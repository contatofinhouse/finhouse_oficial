// Trava silenciosa anti-abuso/scraping (uso humano liberado sem contador visível)
export const DAILY_LIMIT_PER_USER = 30;
export const TRIAL_DURATION_DAYS = 15;
export const PLAN_PRICE_DISPLAY = "R$ 59,90";
export const PLAN_MONTHLY_EQUIVALENT = "R$ 9,98/mês";

const KEY_TRIAL_START = "finhouse_trial_started_at_v1";
const KEY_DAILY_USAGE = "finhouse_daily_dossiers_v1";
const KEY_ANALYZED_LOTS = "finhouse_analyzed_lots_v1";
const KEY_FAVS = "finhouse_leiloes_favs";

function todayBrtString(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export interface TrialQuotaStatus {
  daysLeft: number;
  usedToday: number;
  creditsLeftToday: number;
  dailyLimit: number;
  analyzedLotIds: string[];
  todayLotIds: string[];
}

export function getTrialQuotaStatus(): TrialQuotaStatus {
  if (typeof window === "undefined") {
    return {
      daysLeft: TRIAL_DURATION_DAYS,
      usedToday: 0,
      creditsLeftToday: DAILY_LIMIT_PER_USER,
      dailyLimit: DAILY_LIMIT_PER_USER,
      analyzedLotIds: [],
      todayLotIds: [],
    };
  }

  let startIso = localStorage.getItem(KEY_TRIAL_START);
  if (!startIso) {
    startIso = new Date().toISOString();
    localStorage.setItem(KEY_TRIAL_START, startIso);
  }

  const startMs = new Date(startIso).getTime();
  const elapsedDays = Math.floor(
    (Date.now() - startMs) / (1000 * 60 * 60 * 24)
  );
  const daysLeft = Math.max(0, TRIAL_DURATION_DAYS - elapsedDays);

  const today = todayBrtString();
  let todayLotIds: string[] = [];
  try {
    const raw = localStorage.getItem(KEY_DAILY_USAGE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.date === today && Array.isArray(parsed.lotIds)) {
        todayLotIds = parsed.lotIds;
      }
    }
  } catch {
    todayLotIds = [];
  }

  let analyzedLotIds: string[] = [];
  try {
    const rawAll = localStorage.getItem(KEY_ANALYZED_LOTS);
    if (rawAll) {
      const parsedAll = JSON.parse(rawAll);
      if (Array.isArray(parsedAll)) analyzedLotIds = parsedAll;
    }
  } catch {
    analyzedLotIds = [];
  }

  const usedToday = Math.min(DAILY_LIMIT_PER_USER, todayLotIds.length);
  const creditsLeftToday = Math.max(0, DAILY_LIMIT_PER_USER - usedToday);

  return {
    daysLeft,
    usedToday,
    creditsLeftToday,
    dailyLimit: DAILY_LIMIT_PER_USER,
    analyzedLotIds,
    todayLotIds,
  };
}

export function recordLotAnalysisUsage(
  lotId: string,
  usedCredit = true
): TrialQuotaStatus {
  if (typeof window === "undefined") return getTrialQuotaStatus();

  const current = getTrialQuotaStatus();
  const nextAll = Array.from(new Set([lotId, ...current.analyzedLotIds]));
  localStorage.setItem(KEY_ANALYZED_LOTS, JSON.stringify(nextAll));

  if (usedCredit && !current.todayLotIds.includes(lotId)) {
    const today = todayBrtString();
    const nextToday = [...current.todayLotIds, lotId];
    localStorage.setItem(
      KEY_DAILY_USAGE,
      JSON.stringify({ date: today, lotIds: nextToday })
    );
  }

  return getTrialQuotaStatus();
}

export function getSavedFavoriteIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY_FAVS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") {
      return Object.keys(parsed).filter((k) => Boolean(parsed[k]));
    }
    return [];
  } catch {
    return [];
  }
}

export function toggleFavoriteId(lotId: string): string[] {
  const current = getSavedFavoriteIds();
  const exists = current.includes(lotId);
  const next = exists
    ? current.filter((id) => id !== lotId)
    : [...current, lotId];
  if (typeof window !== "undefined") {
    const objMap: Record<string, boolean> = {};
    for (const id of next) objMap[id] = true;
    localStorage.setItem(KEY_FAVS, JSON.stringify(objMap));
  }
  return next;
}

