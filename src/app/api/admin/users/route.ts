import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { getSessionUser, hashPassword } from "@/lib/auth";
import { createEmployeeSchema } from "@/lib/validation";

function clientMeta(req: Request) {
  return {
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: req.headers.get("user-agent"),
  };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Přístup odepřen." }, { status: 403 });
  }

  const employees = await prisma.user.findMany({
    where: { role: Role.USER },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      createdAt: true,
      _count: { select: { entries: true } },
    },
  });

  return NextResponse.json({
    users: employees.map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username,
      name: u.name,
      createdAt: u.createdAt.toISOString(),
      entryCount: u._count.entries,
    })),
  });
}

export async function POST(req: Request) {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Přístup odepřen." }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatný JSON." }, { status: 400 });
  }

  const parsed = createEmployeeSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validace selhala.", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { email, name, password, username } = parsed.data;
  const meta = clientMeta(req);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Uživatel s tímto e-mailem už existuje." }, { status: 409 });
  }

  if (username) {
    const taken = await prisma.user.findUnique({ where: { username } });
    if (taken) {
      return NextResponse.json(
        { error: "Toto uživatelské jméno je už obsazené." },
        { status: 409 },
      );
    }
  }

  const passwordHash = await hashPassword(password);
  const created = await prisma.user.create({
    data: {
      email,
      username: username ?? null,
      name,
      passwordHash,
      role: Role.USER,
    },
    select: { id: true, email: true, username: true, name: true, createdAt: true },
  });

  await writeAudit({
    actorId: admin.id,
    action: "CREATE_USER",
    entityType: "User",
    entityId: created.id,
    payloadAfter: {
      email: created.email,
      name: created.name,
      ...(created.username ? { username: created.username } : {}),
    },
    ...meta,
  });

  return NextResponse.json(
    {
      user: {
        id: created.id,
        email: created.email,
        username: created.username,
        name: created.name,
        createdAt: created.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}
