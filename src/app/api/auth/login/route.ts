import { NextResponse } from "next/server";
import { writeAudit } from "@/lib/audit";
import {
  createSession,
  findUserByLogin,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";

function clientIp(req: Request): string | null {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() ?? null;
  return req.headers.get("x-real-ip");
}

export async function POST(req: Request) {
  let body: { login?: string; email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatný požadavek." }, { status: 400 });
  }

  const loginRaw =
    typeof body.login === "string"
      ? body.login
      : typeof body.email === "string"
        ? body.email
        : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!loginRaw.trim() || !password) {
    return NextResponse.json(
      { error: "Vyplňte přihlašovací jméno nebo e-mail a heslo." },
      { status: 400 },
    );
  }

  const user = await findUserByLogin(loginRaw);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Neplatné přihlašovací údaje." }, { status: 401 });
  }

  const token = await createSession(user.id);
  const opts = sessionCookieOptions();

  await writeAudit({
    actorId: user.id,
    action: "LOGIN",
    entityType: "User",
    entityId: user.id,
    payloadAfter: { email: user.email },
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent"),
  });

  const res = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
  res.cookies.set(opts.name, token, opts);
  return res;
}
