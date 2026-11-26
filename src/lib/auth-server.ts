import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const ADMIN_EMAILS = [
  "contato@finhouse.com.br",
  "admin@finhouse.com.br",
  "contatofinhouse@gmail.com",
];

export interface ServerUser {
  id: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
  createdAt: string | null;
}

export interface UserAccessState {
  plan: "trial" | "premium" | "admin";
  startedAt: string;
  expiresAt: string;
  daysLeft: number;
  isActive: boolean;
  dailyLimit: number;
  usedToday: number;
  creditsLeftToday: number;
  analyzedLotIds: string[];
  whatsapp: string | null;
  whatsappAlertsOptIn: boolean;
  onboardingCompleted: boolean;
}

const TRIAL_DAYS = Number(process.env.TRIAL_DAYS || "15");
// Limite silencioso anti-abuso/automação nos bastidores (uso humano é ilimitado na UI)
const DEFAULT_DAILY_LIMIT = Number(process.env.REPORTS_DAILY_PER_USER || "30");
const memoryDailyAbuseTracker = new Map<string, { date: string; lotIds: Set<string> }>();

/**
 * Valida o token Bearer enviado no cabeçalho Authorization usando Supabase Auth.
 */
export async function getServerUser(req: Request): Promise<ServerUser | null> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!token) return null;

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://ovwlviiojtktuhmvqahi.supabase.co";
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  if (!supabaseUrl || !supabaseKey) return null;

  const client = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) return null;

  const email = (data.user.email || "").toLowerCase();
  const fullName =
    (data.user.user_metadata?.full_name as string) ||
    (data.user.user_metadata?.name as string) ||
    email.split("@")[0] ||
    "Investidor";

  return {
    id: data.user.id,
    email,
    fullName,
    isAdmin: ADMIN_EMAILS.includes(email),
    createdAt: data.user.created_at || null,
  };
}

/**
 * Retorna início do dia atual no fuso de Brasília (America/Sao_Paulo) em ISO UTC.
 */
function getTodayStartBRTIso(): string {
  const now = new Date();
  const brtStr = now.toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  }); // YYYY-MM-DD
  return new Date(`${brtStr}T00:00:00-03:00`).toISOString();
}

/**
 * Carrega (ou cria no 1º acesso) o estado de acesso do usuário no Supabase.
 */
export async function getUserAccessState(
  user: ServerUser
): Promise<UserAccessState> {
  const admin = getSupabaseAdmin();
  const now = Date.now();
  const parsedCreatedMs =
    user.createdAt && !Number.isNaN(Date.parse(user.createdAt))
      ? Date.parse(user.createdAt)
      : now;
  const fallbackStartMs = Math.min(now, parsedCreatedMs);
  const fallbackStartIso = new Date(fallbackStartMs).toISOString();
  const fallbackExpiresMs = fallbackStartMs + TRIAL_DAYS * 24 * 60 * 60 * 1000;
  const fallbackExpiresIso = new Date(fallbackExpiresMs).toISOString();

  // Fallback real baseado na data imutável de criação da conta no Supabase Auth
  if (!admin) {
    const msLeft = fallbackExpiresMs - now;
    const daysLeft = user.isAdmin
      ? 999
      : Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
    return {
      plan: user.isAdmin ? "admin" : "trial",
      startedAt: fallbackStartIso,
      expiresAt: fallbackExpiresIso,
      daysLeft,
      isActive: user.isAdmin || msLeft > 0,
      dailyLimit: user.isAdmin ? 999 : DEFAULT_DAILY_LIMIT,
      usedToday: 0,
      creditsLeftToday: user.isAdmin ? 999 : DEFAULT_DAILY_LIMIT,
      analyzedLotIds: [],
      whatsapp: null,
      whatsappAlertsOptIn: false,
      onboardingCompleted: user.isAdmin,
    };
  }

  let { data: acc } = await admin
    .from("user_access")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!acc) {
    const { data: inserted } = await admin
      .from("user_access")
      .upsert(
        {
          user_id: user.id,
          email: user.email,
          full_name: user.fullName,
          plan: user.isAdmin ? "admin" : "trial",
          started_at: fallbackStartIso,
          expires_at: fallbackExpiresIso,
          daily_limit: DEFAULT_DAILY_LIMIT,
          onboarding_completed: user.isAdmin,
        },
        { onConflict: "user_id" }
      )
      .select("*")
      .single();
    acc = inserted;
  }

  const plan: "trial" | "premium" | "admin" = user.isAdmin
    ? "admin"
    : (acc?.plan as "trial" | "premium" | "admin") || "trial";

  const expiresAt = acc?.expires_at || fallbackExpiresIso;
  const msLeft = new Date(expiresAt).getTime() - now;
  const daysLeft =
    plan === "admin" ? 999 : Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
  const isActive = plan === "admin" || msLeft > 0;
  const dailyLimit =
    plan === "admin"
      ? 999
      : Math.max(DEFAULT_DAILY_LIMIT, acc?.daily_limit ?? DEFAULT_DAILY_LIMIT);

  const todayStartIso = getTodayStartBRTIso();

  const [{ data: allReqs }, { count: usedTodayCount }] = await Promise.all([
    admin
      .from("report_requests")
      .select("lot_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200),
    admin
      .from("report_requests")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("used_credit", true)
      .gte("created_at", todayStartIso),
  ]);

  const usedToday = usedTodayCount || 0;
  const creditsLeftToday =
    plan === "admin" ? 999 : Math.max(0, dailyLimit - usedToday);

  return {
    plan,
    startedAt: acc?.started_at || fallbackStartIso,
    expiresAt,
    daysLeft,
    isActive,
    dailyLimit,
    usedToday,
    creditsLeftToday,
    analyzedLotIds: (allReqs || []).map((r) => r.lot_id),
    whatsapp: acc?.whatsapp || null,
    whatsappAlertsOptIn: Boolean(acc?.whatsapp_alerts_opt_in),
    onboardingCompleted: Boolean(acc?.onboarding_completed || user.isAdmin),
  };
}

/**
 * Vincula lote ao histórico do usuário e aplica trava silenciosa anti-abuso nos bastidores.
 */
export async function reserveOrLinkLotReport(
  user: ServerUser,
  lotId: string,
  fromCache: boolean
): Promise<{ ok: true } | { ok: false; code: "expired" | "limit" }> {
  const access = await getUserAccessState(user);
  if (!access.isActive) return { ok: false, code: "expired" };

  const admin = getSupabaseAdmin();

  // Fallback em memória para proteção anti-scraping caso SUPABASE_SERVICE_ROLE_KEY não esteja ativa
  if (!admin) {
    if (!user.isAdmin && !fromCache) {
      const todayKey = getTodayStartBRTIso().slice(0, 10);
      const current = memoryDailyAbuseTracker.get(user.id);
      if (!current || current.date !== todayKey) {
        memoryDailyAbuseTracker.set(user.id, {
          date: todayKey,
          lotIds: new Set([lotId]),
        });
      } else {
        if (!current.lotIds.has(lotId) && current.lotIds.size >= DEFAULT_DAILY_LIMIT) {
          return { ok: false, code: "limit" };
        }
        current.lotIds.add(lotId);
      }
    }
    return { ok: true };
  }

  if (user.isAdmin || fromCache) {
    await admin
      .from("report_requests")
      .upsert(
        { user_id: user.id, lot_id: lotId, used_credit: false },
        { onConflict: "user_id,lot_id" }
      );
    return { ok: true };
  }

  // Verifica trava silenciosa anti-abuso diretamente (independente de valores antigos de daily_limit=3 no banco)
  if (!access.analyzedLotIds.includes(lotId) && access.usedToday >= access.dailyLimit) {
    return { ok: false, code: "limit" };
  }

  await admin
    .from("report_requests")
    .upsert(
      { user_id: user.id, lot_id: lotId, used_credit: true },
      { onConflict: "user_id,lot_id" }
    );

  return { ok: true };
}

