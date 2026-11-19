import { NextResponse } from "next/server";
import { getServerUser, getUserAccessState } from "@/lib/auth-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getServerUser(req);
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const rawPhone = typeof body?.whatsapp === "string" ? body.whatsapp : "";
    const digits = rawPhone.replace(/\D/g, "");
    const normalizedWhatsapp =
      digits.length >= 10
        ? digits.startsWith("55")
          ? digits
          : `55${digits}`
        : null;
    const whatsappAlertsOptIn =
      Boolean(body?.whatsappAlertsOptIn) && Boolean(normalizedWhatsapp);

    const admin = getSupabaseAdmin();
    if (admin) {
      await admin
        .from("user_access")
        .upsert(
          {
            user_id: user.id,
            email: user.email,
            full_name: user.fullName,
            whatsapp: normalizedWhatsapp,
            whatsapp_alerts_opt_in: whatsappAlertsOptIn,
            onboarding_completed: true,
          },
          { onConflict: "user_id" }
        );
    }

    const access = await getUserAccessState(user);
    return NextResponse.json({ success: true, access });
  } catch (err: unknown) {
    console.error("[API Onboarding] Erro:", err);
    return NextResponse.json(
      { error: "Falha ao salvar preferências" },
      { status: 500 }
    );
  }
}
