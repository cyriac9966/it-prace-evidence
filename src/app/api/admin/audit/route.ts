import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { auditRangeToGte } from "@/lib/audit-diff";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Přístup odepřen." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10) || 0);
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? "40") || 40, 1), 100);
  const actorId = searchParams.get("actorId")?.trim() || undefined;
  const range = searchParams.get("range")?.trim() || "all";

  const gte = auditRangeToGte(range);
  const where: Prisma.AuditLogWhereInput = {
    ...(actorId ? { actorId } : {}),
    ...(gte ? { createdAt: { gte: gte } } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: page * limit,
      take: limit,
      include: {
        actor: { select: { id: true, email: true, name: true, role: true } },
      },
    }),
  ]);

  return NextResponse.json({
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    filters: { actorId: actorId ?? null, range },
    items: rows.map((r) => ({
      id: r.id,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      payloadBefore: r.payloadBefore,
      payloadAfter: r.payloadAfter,
      ip: r.ip,
      userAgent: r.userAgent,
      createdAt: r.createdAt.toISOString(),
      actor: r.actor,
    })),
  });
}
