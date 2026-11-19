import { NextResponse } from "next/server";
import { getServerUser, getUserAccessState } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getServerUser(req);
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const access = await getUserAccessState(user);
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isAdmin: user.isAdmin,
    },
    access,
  });
}
