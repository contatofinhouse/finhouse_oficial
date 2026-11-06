import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const z = searchParams.get("z");
  const x = searchParams.get("x");
  const y = searchParams.get("y");
  const r = searchParams.get("r") || "";

  if (!z || !x || !y || !/^\d+$/.test(z) || !/^\d+$/.test(x) || !/^\d+$/.test(y)) {
    return new NextResponse("Parâmetros de tile inválidos", { status: 400 });
  }

  // Lê a chave apenas no servidor (CARTO_API_KEY privada, sem expor no navegador)
  const cartoKey = process.env.CARTO_API_KEY || process.env.NEXT_PUBLIC_CARTO_API_KEY || "";
  const safeRetina = r === "@2x" ? "@2x" : "";

  const subdomains = ["a", "b", "c", "d"];
  const sub = subdomains[(Number(x) + Number(y)) % subdomains.length];

  const upstreamUrl = `https://${sub}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}${safeRetina}.png${
    cartoKey ? `?key=${encodeURIComponent(cartoKey)}` : ""
  }`;

  try {
    const res = await fetch(upstreamUrl, {
      headers: {
        Accept: "image/png,image/*;q=0.8",
        "User-Agent": "FinhouseMapProxy/1.0",
      },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return new NextResponse("Erro ao carregar tile", { status: res.status });
    }

    const arrayBuffer = await res.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new NextResponse("Falha no proxy de mapa", { status: 502 });
  }
}
