import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getServerUser(req);
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const reason =
      typeof body?.reason === "string" && body.reason
        ? body.reason
        : "voluntary_cta";
    const rawPhone = typeof body?.whatsapp === "string" ? body.whatsapp : "";
    const digits = rawPhone.replace(/\D/g, "");
    const normalizedWhatsapp =
      digits.length >= 10
        ? digits.startsWith("55")
          ? digits
          : `55${digits}`
        : null;

    const admin = getSupabaseAdmin();
    if (admin) {
      let whatsappToSave = normalizedWhatsapp;
      if (!whatsappToSave) {
        const { data: acc } = await admin
          .from("user_access")
          .select("whatsapp")
          .eq("user_id", user.id)
          .maybeSingle();
        whatsappToSave = acc?.whatsapp || null;
      }

      await admin.from("upgrade_interest").upsert(
        {
          user_id: user.id,
          email: user.email,
          whatsapp: whatsappToSave,
          reason,
          created_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    }

    return NextResponse.json({
      success: true,
      email: user.email,
      message:
        "Solicitação registrada! Enviaremos o link de pagamento (R$ 59,90 por 6 meses) no seu e-mail.",
    });
  } catch (err: unknown) {
    console.error("[API Upgrade Interest] Erro:", err);
    return NextResponse.json(
      { error: "Falha ao registrar interesse" },
      { status: 500 }
    );
  }
}
