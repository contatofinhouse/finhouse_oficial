import { NextResponse } from "next/server";
import { runDailyScrape, saveDailySnapshot } from "@/lib/leiloes-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Permite até 60s em planos Vercel Pro se necessário

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uf = (searchParams.get("uf") || "sp").toLowerCase();

    // Verificação de segurança opcional se CRON_SECRET estiver definido no Vercel
    const authHeader = req.headers.get("authorization");
    const isVercelCron = req.headers.get("x-vercel-cron") === "1";
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && !isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    console.log(`[Cron] Iniciando raspagem diária agendada para UF: ${uf.toUpperCase()}...`);
    const lots = await runDailyScrape(uf);

    const snapshot = await saveDailySnapshot(uf, lots);
    console.log(`[Cron] Raspagem diária concluída. ${snapshot.count} lotes salvos no snapshot.`);

    return NextResponse.json({
      success: true,
      message: "Snapshot diário de leilões gerado e salvo com sucesso",
      uf: snapshot.uf,
      count: snapshot.count,
      updatedAt: snapshot.updatedAt,
      timestamp: snapshot.timestamp,
    });
  } catch (error: any) {
    console.error("[Cron] Erro na execução da raspagem diária:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Falha na execução do Cron diário de leilões",
        details: error?.message,
      },
      { status: 500 }
    );
  }
}

