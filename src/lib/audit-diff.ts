import type { ActivityType, AuditAction, ResultStatus } from "@prisma/client";
import { ACTIVITY_LABEL, RESULT_LABEL } from "@/lib/entry-labels";

const ENTRY_FIELD_LABELS: Record<string, string> = {
  title: "Shrnutí (co řešil)",
  workDate: "Datum práce",
  activityType: "Typ činnosti",
  reporter: "Kdo zadal / nahlásil",
  whereResolved: "Kde se to řešilo",
  resultStatus: "Výsledek",
  communicationSummary: "Komunikace – souhrn",
  communicationOutcome: "Komunikace – výsledek",
  analysisSummary: "Analýza – průběh",
  analysisConclusion: "Analýza – závěr",
  testingScope: "Testování – rozsah",
  testingOutcome: "Testování – výsledek",
  adminDescription: "Administrativa",
  evidenceUrl: "Odkaz na důkaz",
  evidenceFileName: "Příloha (soubor)",
  hasEvidenceFile: "Je nahrána příloha",
  steps: "Kroky práce",
};

const DIFF_KEYS = [
  "title",
  "workDate",
  "activityType",
  "reporter",
  "whereResolved",
  "resultStatus",
  "communicationSummary",
  "communicationOutcome",
  "analysisSummary",
  "analysisConclusion",
  "testingScope",
  "testingOutcome",
  "adminDescription",
  "evidenceUrl",
  "evidenceFileName",
  "hasEvidenceFile",
  "steps",
] as const;

function safeParseRecord(s: string | null): Record<string, unknown> | null {
  if (!s) return null;
  try {
    const o = JSON.parse(s) as unknown;
    if (typeof o === "object" && o !== null && !Array.isArray(o)) {
      return o as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function fmtActivity(val: unknown): string {
  if (typeof val === "string" && val in ACTIVITY_LABEL) {
    return ACTIVITY_LABEL[val as ActivityType];
  }
  return String(val ?? "—");
}

function fmtResult(val: unknown): string {
  if (typeof val === "string" && val in RESULT_LABEL) {
    return RESULT_LABEL[val as ResultStatus];
  }
  return String(val ?? "—");
}

function formatStepsBrief(steps: unknown): string {
  if (!Array.isArray(steps) || steps.length === 0) return "—";
  return steps
    .map((s, i) => {
      const row = s as { description?: string; minutes?: number };
      const d = row.description?.trim() || "—";
      const m = row.minutes ?? 0;
      return `${i + 1}. ${d} (${m} min)`;
    })
    .join(" · ");
}

function fmtScalar(key: string, val: unknown): string {
  if (val == null || val === "") return "—";
  if (key === "workDate" && typeof val === "string") {
    const d = new Date(val);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString("cs-CZ");
  }
  if (key === "activityType") return fmtActivity(val);
  if (key === "resultStatus") return fmtResult(val);
  if (key === "steps") return formatStepsBrief(val);
  if (key === "hasEvidenceFile") return val === true ? "ano" : val === false ? "ne" : String(val);
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function truncateLine(s: string, max = 200): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function describeWorkEntryDiff(payloadBefore: string, payloadAfter: string): string[] {
  const before = safeParseRecord(payloadBefore);
  const after = safeParseRecord(payloadAfter);
  if (!before || !after) return ["Nelze porovnat záznamy (poškozená data v logu)."];

  const lines: string[] = [];
  for (const key of DIFF_KEYS) {
    const bv = before[key];
    const av = after[key];
    if (same(bv, av)) continue;
    const label = ENTRY_FIELD_LABELS[key] ?? key;
    const from = truncateLine(fmtScalar(key, bv));
    const to = truncateLine(fmtScalar(key, av));
    lines.push(`${label}: „${from}“ → „${to}“`);
  }
  if (lines.length === 0) return ["Úprava bez detekovaných rozdílů v uložených polích."];
  return lines;
}

function entryHeadline(rec: Record<string, unknown> | null): string {
  if (!rec) return "—";
  const title = typeof rec.title === "string" ? rec.title : "—";
  const act = fmtActivity(rec.activityType);
  return truncateLine(`${title} (${act})`, 120);
}

export function describeAuditHumanReadable(
  action: AuditAction,
  payloadBefore: string | null,
  payloadAfter: string | null,
): { headline: string; changes: string[] } {
  const before = safeParseRecord(payloadBefore);
  const after = safeParseRecord(payloadAfter);

  switch (action) {
    case "UPDATE_ENTRY": {
      if (payloadBefore && payloadAfter) {
        const changes = describeWorkEntryDiff(payloadBefore, payloadAfter);
        return { headline: "Úprava záznamu práce", changes };
      }
      return { headline: "Úprava záznamu", changes: [] };
    }
    case "CREATE_ENTRY": {
      const h = after ? `Nový záznam: ${entryHeadline(after)}` : "Nový záznam práce";
      const extra: string[] = [];
      if (after) {
        const wr = after.whereResolved;
        if (typeof wr === "string" && wr.trim()) {
          extra.push(`Kde řešeno: „${truncateLine(wr)}“`);
        }
        const st = formatStepsBrief(after.steps);
        if (st !== "—") extra.push(`Kroky: ${st}`);
      }
      return { headline: h, changes: extra };
    }
    case "DELETE_ENTRY": {
      const h = before ? `Smazaný záznam: ${entryHeadline(before)}` : "Smazaný záznam práce";
      const extra: string[] = [];
      if (before) {
        const wr = before.whereResolved;
        if (typeof wr === "string" && wr.trim()) {
          extra.push(`Naposledy „kde řešeno“: „${truncateLine(wr)}“`);
        }
      }
      return { headline: h, changes: extra };
    }
    case "CREATE_USER": {
      if (after && typeof after.email === "string") {
        const name = typeof after.name === "string" ? after.name : "";
        const un =
          after.username && typeof after.username === "string"
            ? ` · přihlášení také „${after.username}“`
            : "";
        return {
          headline: `Nový účet zaměstnance`,
          changes: [`${name || after.email} · ${after.email}${un}`],
        };
      }
      return { headline: "Nový účet", changes: [] };
    }
    case "LOGIN": {
      const email =
        after && typeof after.email === "string" ? after.email : "—";
      return { headline: "Přihlášení", changes: [email] };
    }
    case "LOGOUT":
      return { headline: "Odhlášení", changes: [] };
    default:
      return { headline: String(action), changes: [] };
  }
}

export function auditRangeToGte(range: string): Date | undefined {
  if (range === "24h") return new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (range === "7d") return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (range === "30d") return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return undefined;
}

export function buildAuditListQuery(params: {
  page: number;
  actorId?: string;
  range?: string;
}): string {
  const p = new URLSearchParams();
  p.set("page", String(Math.max(0, params.page)));
  if (params.actorId?.trim()) p.set("actorId", params.actorId.trim());
  if (params.range && params.range !== "all") p.set("range", params.range);
  const s = p.toString();
  return s ? `?${s}` : "";
}
