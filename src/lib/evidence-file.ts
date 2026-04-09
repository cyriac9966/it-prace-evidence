import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { del, put } from "@vercel/blob";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "evidence");

export function useBlobEvidence(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function evidenceDirForEntry(entryId: string) {
  return path.join(UPLOAD_ROOT, entryId);
}

export function isBlobStoredPath(stored: string | null | undefined): boolean {
  if (!stored) return false;
  return stored.startsWith("https://");
}

export async function removeEvidenceFile(storedPath: string | null | undefined) {
  if (!storedPath) return;
  if (isBlobStoredPath(storedPath)) {
    await del(storedPath);
    return;
  }
  try {
    await unlink(storedPath);
  } catch {
    /* soubor už nemusí existovat */
  }
}

export async function saveEvidenceFile(
  entryId: string,
  originalName: string,
  buffer: Buffer,
  mimeType: string,
): Promise<{ absolutePath: string; safeName: string }> {
  const ext = path.extname(originalName).slice(0, 20) || ".bin";
  const base = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const safeName = `${base}${ext}`;

  if (useBlobEvidence()) {
    const pathname = `evidence/${entryId}/${safeName}`;
    const blob = await put(pathname, buffer, {
      access: "private",
      addRandomSuffix: true,
      contentType: mimeType || "application/octet-stream",
    });
    return { absolutePath: blob.url, safeName: originalName };
  }

  const dir = evidenceDirForEntry(entryId);
  await mkdir(dir, { recursive: true });
  const absolutePath = path.join(dir, safeName);
  await writeFile(absolutePath, buffer);
  return { absolutePath, safeName };
}
