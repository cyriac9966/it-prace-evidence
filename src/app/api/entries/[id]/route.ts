import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { getSessionUser } from "@/lib/auth";
import { workEntryBodySchema } from "@/lib/validation";
import { serializeEntry } from "@/lib/entry-serialize";
import { removeEvidenceFile } from "@/lib/evidence-file";
import { stepsCreateFromBody, structuredFieldsFromBody } from "@/lib/entry-payload";
import { activityUsesSteps } from "@/lib/activity-form";

function clientMeta(req: Request) {
  return {
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: req.headers.get("user-agent"),
  };
}

function loadEntryAsOwner(id: string, userId: string) {
  return prisma.workEntry.findFirst({
    where: { id, userId },
    include: { steps: true },
  });
}

function loadEntryAsAdmin(id: string) {
  return prisma.workEntry.findFirst({
    where: { id },
    include: {
      steps: true,
      user: { select: { name: true, email: true } },
    },
  });
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nepřihlášen." }, { status: 401 });
  }
  const { id } = await ctx.params;

  if (user.role === "ADMIN") {
    const entry = await loadEntryAsAdmin(id);
    if (!entry) {
      return NextResponse.json({ error: "Záznam nenalezen." }, { status: 404 });
    }
    const { user: author, ...rest } = entry;
    return NextResponse.json({
      entry: serializeEntry(rest),
      author,
      readOnly: true as const,
    });
  }

  const entry = await loadEntryAsOwner(id, user.id);
  if (!entry) {
    return NextResponse.json({ error: "Záznam nenalezen." }, { status: 404 });
  }
  return NextResponse.json({ entry: serializeEntry(entry), readOnly: false as const });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nepřihlášen." }, { status: 401 });
  }
  if (user.role === "ADMIN") {
    return NextResponse.json(
      {
        error:
          "Administrátor nemůže upravovat záznamy práce. Úpravy provádí zaměstnanec u svého záznamu.",
      },
      { status: 403 },
    );
  }

  const { id } = await ctx.params;
  const before = await loadEntryAsOwner(id, user.id);
  if (!before) {
    return NextResponse.json({ error: "Záznam nenalezen." }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Neplatný JSON." }, { status: 400 });
  }

  const parsed = workEntryBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Zkontrolujte formulář.",
        fields: parsed.error.flatten().fieldErrors,
        issues: parsed.error.issues.map((i) => ({
          message: i.message,
          path: i.path.join(".") || "form",
        })),
      },
      { status: 400 },
    );
  }

  const meta = clientMeta(req);
  const snapshotBefore = serializeEntry(before);
  const d = parsed.data;
  const structured = structuredFieldsFromBody(d);
  const stepRows = stepsCreateFromBody(d);
  const withSteps = activityUsesSteps(d.activityType);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.workStep.deleteMany({ where: { entryId: id } });
    await tx.workEntry.update({
      where: { id },
      data: {
        title: d.title,
        workDate: new Date(d.workDate),
        activityType: d.activityType,
        reporter: d.reporter,
        whereResolved: d.whereResolved,
        resultStatus: d.resultStatus,
        evidenceUrl: d.evidenceUrl ?? null,
        ...structured,
        ...(withSteps
          ? {
              steps: {
                create: stepRows,
              },
            }
          : {}),
      },
    });
    return tx.workEntry.findUniqueOrThrow({
      where: { id },
      include: { steps: true },
    });
  });

  await writeAudit({
    actorId: user.id,
    action: "UPDATE_ENTRY",
    entityType: "WorkEntry",
    entityId: id,
    payloadBefore: snapshotBefore,
    payloadAfter: serializeEntry(updated),
    ...meta,
  });

  return NextResponse.json({ entry: serializeEntry(updated) });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nepřihlášen." }, { status: 401 });
  }
  if (user.role === "ADMIN") {
    return NextResponse.json(
      {
        error:
          "Administrátor nemůže mazat záznamy práce. Mazání provádí zaměstnanec u svého záznamu.",
      },
      { status: 403 },
    );
  }

  const { id } = await ctx.params;
  const entry = await loadEntryAsOwner(id, user.id);
  if (!entry) {
    return NextResponse.json({ error: "Záznam nenalezen." }, { status: 404 });
  }

  const snapshotBefore = serializeEntry(entry);
  const meta = clientMeta(req);

  await removeEvidenceFile(entry.evidenceStoredPath);
  await prisma.workEntry.delete({ where: { id } });

  await writeAudit({
    actorId: user.id,
    action: "DELETE_ENTRY",
    entityType: "WorkEntry",
    entityId: id,
    payloadBefore: snapshotBefore,
    ...meta,
  });

  return NextResponse.json({ ok: true });
}
