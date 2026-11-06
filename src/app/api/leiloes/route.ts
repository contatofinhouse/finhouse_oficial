import { NextResponse } from "next/server";
import {
  type ScrapedAuctionLot,
  loadDailySnapshot,
  runDailyScrape,
  saveDailySnapshot,
} from "@/lib/leiloes-service";

export type { ScrapedAuctionLot };

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uf = (searchParams.get("uf") || "sp").toLowerCase();

    // 1. Tenta carregar o snapshot diário pré-processado (Vercel Blob / Disco / Memória)
    const existing = await loadDailySnapshot(uf);
    if (existing && existing.lots.length > 0) {
      return NextResponse.json({
        uf: existing.uf,
        count: existing.lots.length,
        cachedDaily: true,
        updatedAt: existing.updatedAt,
        timestamp: existing.timestamp,
        lots: existing.lots,
      });
    }

    // 2. Se não houver snapshot recente salvo (> 24h), executa a coleta e salva
    console.log(`[API Leilões] Nenhum snapshot válido encontrado para UF: ${uf}. Executando coleta inicial...`);
    const lots = await runDailyScrape(uf);
    const saved = await saveDailySnapshot(uf, lots);

    return NextResponse.json({
      uf: saved.uf,
      count: saved.lots.length,
      cachedDaily: false,
      updatedAt: saved.updatedAt,
      timestamp: saved.timestamp,
      lots: saved.lots,
    });
  } catch (error: any) {
    console.error("Erro ao carregar leilões:", error);
    return NextResponse.json(
      { error: "Falha ao processar leilões", details: error?.message },
      { status: 500 }
    );
  }
}
