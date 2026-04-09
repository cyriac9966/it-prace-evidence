import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { writeAudit } from "@/lib/audit";
import {
  COOKIE,
  deleteSessionByCookieValue,
  getSessionUser,
  sessionCookieOptions,
} from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getSessionUser();
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;

  await deleteSessionByCookieValue(raw);

  if (user) {
    await writeAudit({
      actorId: user.id,
      action: "LOGOUT",
      entityType: "User",
      entityId: user.id,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: req.headers.get("user-agent"),
    });
  }

  const opts = sessionCookieOptions();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(opts.name, "", { ...opts, maxAge: 0 });
  return res;
}
