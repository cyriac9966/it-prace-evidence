import { readFile, stat } from "fs/promises";
import path from "path";
import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { isBlobStoredPath, removeEvidenceFile, saveEvidenceFile } from "@/lib/evidence-file";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "text/plain",
  "application/pdf",
]);

function canAccessEntry(
  user: { id: string; role: string },
  entryUserId: string,
) {
  return user.role === "ADMIN" || entryUserId === user.id;
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
  const entry = await prisma.workEntry.findUnique({
    where: { id },
    select: { userId: true, evidenceStoredPath: true, evidenceFileName: true },
  });
  if (!entry?.evidenceStoredPath || !canAccessEntry(user, entry.userId)) {
    return NextResponse.json({ error: "Soubor nenalezen." }, { status: 404 });
  }

  const headers = new Headers();
  if (entry.evidenceFileName) {
    headers.set(
      "Content-Disposition",
      `inline; filename*=UTF-8''${encodeURIComponent(entry.evidenceFileName)}`,
    );
  }

  if (isBlobStoredPath(entry.evidenceStoredPath)) {
    const result = await get(entry.evidenceStoredPath, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return NextResponse.json({ error: "Soubor nenalezen." }, { status: 404 });
    }
    headers.set("Content-Type", result.blob.contentType);
    return new NextResponse(result.stream, { headers });
  }

  try {
    await stat(entry.evidenceStoredPath);
  } catch {
    return NextResponse.json({ error: "Soubor na disku neexistuje." }, { status: 404 });
  }

  const ext = path.extname(entry.evidenceStoredPath).toLowerCase();
  const type =
    ext === ".pdf"
      ? "application/pdf"
      : ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
          ? "image/jpeg"
          : ext === ".webp"
            ? "image/webp"
            : ext === ".gif"
              ? "image/gif"
              : ext === ".txt"
                ? "text/plain"
                : "application/octet-stream";

  const buf = await readFile(entry.evidenceStoredPath);
  headers.set("Content-Type", type);

  return new NextResponse(buf, { headers });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role === "ADMIN") {
    return NextResponse.json({ error: "Nahrát může jen zaměstnanec k vlastnímu záznamu." }, { status: 403 });
  }
  const { id } = await ctx.params;
  const entry = await prisma.workEntry.findFirst({
    where: { id, userId: user.id },
    select: { id: true, evidenceStoredPath: true },
  });
  if (!entry) {
    return NextResponse.json({ error: "Záznam nenalezen." }, { status: 404 });
  }

  const ct = req.headers.get("content-type") ?? "";
  if (!ct.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Očekávám multipart/form-data s polem file." }, { status: 400 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Chybí soubor (pole file)." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Soubor je příliš velký (max. 8 MB)." }, { status: 400 });
  }
  const mime = file.type || "application/octet-stream";
  if (!ALLOWED.has(mime)) {
    return NextResponse.json(
      { error: "Nepovolený typ souboru. Povolené: obrázky, PDF, text." },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  await removeEvidenceFile(entry.evidenceStoredPath);
  const { absolutePath } = await saveEvidenceFile(entry.id, file.name, buf, mime);

  await prisma.workEntry.update({
    where: { id: entry.id },
    data: {
      evidenceStoredPath: absolutePath,
      evidenceFileName: file.name,
    },
  });

  return NextResponse.json({ ok: true, fileName: file.name });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user || user.role === "ADMIN") {
    return NextResponse.json({ error: "Smazat přílohu může jen zaměstnanec u vlastního záznamu." }, { status: 403 });
  }
  const { id } = await ctx.params;
  const entry = await prisma.workEntry.findFirst({
    where: { id, userId: user.id },
    select: { evidenceStoredPath: true },
  });
  if (!entry) {
    return NextResponse.json({ error: "Záznam nenalezen." }, { status: 404 });
  }
  await removeEvidenceFile(entry.evidenceStoredPath);
  await prisma.workEntry.update({
    where: { id },
    data: { evidenceStoredPath: null, evidenceFileName: null },
  });
  return NextResponse.json({ ok: true });
}
