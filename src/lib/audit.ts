import type { AuditAction } from "@prisma/client";
import { prisma } from "./db";

export async function writeAudit(params: {
  actorId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  payloadBefore?: unknown;
  payloadAfter?: unknown;
  ip?: string | null;
  userAgent?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      payloadBefore:
        params.payloadBefore !== undefined
          ? JSON.stringify(params.payloadBefore)
          : null,
      payloadAfter:
        params.payloadAfter !== undefined
          ? JSON.stringify(params.payloadAfter)
          : null,
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    },
  });
}
