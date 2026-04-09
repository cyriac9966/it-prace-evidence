import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { getSessionUser } from "@/lib/auth";
import { workEntryBodySchema } from "@/lib/validation";
import { serializeEntry } from "@/lib/entry-serialize";
import { stepsCreateFromBody, structuredFieldsFromBody } from "@/lib/entry-payload";

function clientMeta(req: Request) {
  return {
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: req.headers.get("user-agent"),
  };
}

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nepřihlášen." }, { status: 401 });
  }

  const entries = await prisma.workEntry.findMany({
    where: user.role === "ADMIN" ? {} : { userId: user.id },
    include: { steps: true, user: { select: { id: true, name: true, email: true } } },
    orderBy: { workDate: "desc" },
  });

  return NextResponse.json({
    entries: entries.map((e) => {
      const { user: author, ...rest } = e;
      return {
        ...serializeEntry(rest),
        author,
      };
    }),
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Nepřihlášen." }, { status: 401 });
  }
  if (user.role === "ADMIN") {
    return NextResponse.json(
      {
        error:
          "Administrátor do systému práci nezadává. Záznamy vytvářejí pouze zaměstnanci.",
      },
      { status: 403 },
    );
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

  const data = parsed.data;
  const meta = clientMeta(req);
  const structured = structuredFieldsFromBody(data);
  const stepRows = stepsCreateFromBody(data);

  const created = await prisma.$transaction(async (tx) => {
    return tx.workEntry.create({
      data: {
        userId: user.id,
        title: data.title,
        workDate: new Date(data.workDate),
        activityType: data.activityType,
        reporter: data.reporter,
        whereResolved: data.whereResolved,
        resultStatus: data.resultStatus,
        evidenceUrl: data.evidenceUrl ?? null,
        ...structured,
        steps: { create: stepRows },
      },
      include: { steps: true },
    });
  });

  const full = await prisma.workEntry.findUniqueOrThrow({
    where: { id: created.id },
    include: { steps: true },
  });

  await writeAudit({
    actorId: user.id,
    action: "CREATE_ENTRY",
    entityType: "WorkEntry",
    entityId: full.id,
    payloadAfter: serializeEntry(full),
    ...meta,
  });

  return NextResponse.json({ entry: serializeEntry(full) }, { status: 201 });
}
