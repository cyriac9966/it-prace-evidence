import type { ActivityType, ResultStatus } from "@prisma/client";
import Link from "next/link";
import { ACTIVITY_LABEL, RESULT_LABEL } from "@/lib/entry-labels";
import { activityUsesSteps } from "@/lib/activity-form";

type Step = { description: string; minutes: number; sortOrder: number };
type Author = { name: string; email: string };

type Props = {
  entryId: string;
  title: string;
  workDate: Date;
  activityType: ActivityType;
  reporter: string;
  whereResolved: string;
  resultStatus: ResultStatus;
  communicationSummary: string | null;
  communicationOutcome: string | null;
  analysisSummary: string | null;
  analysisConclusion: string | null;
  testingScope: string | null;
  testingOutcome: string | null;
  adminDescription: string | null;
  evidenceUrl: string | null;
  evidenceFileName: string | null;
  hasEvidenceFile: boolean;
  steps: Step[];
  author?: Author;
};

function StepsBlock({ steps }: { steps: Step[] }) {
  const ordered = [...steps].sort((a, b) => a.sortOrder - b.sortOrder);
  const totalMin = ordered.reduce((s, x) => s + x.minutes, 0);
  if (ordered.length === 0) {
    return <p className="mt-2 text-sm text-[var(--muted)]">Žádné kroky.</p>;
  }
  return (
    <>
      <p className="mt-1 text-xs text-[var(--muted)]">Součet času: {totalMin} min</p>
      <ol className="mt-3 space-y-4">
        {ordered.map((s, i) => (
          <li
            key={i}
            className="rounded-lg border border-[var(--border)]/80 bg-[var(--bg)]/50 p-4"
          >
            <div className="text-xs font-medium text-[var(--muted)]">
              Krok {i + 1} · {s.minutes} min
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{s.description}</p>
          </li>
        ))}
      </ol>
    </>
  );
}

export function WorkEntryReadOnly({
  entryId,
  title,
  workDate,
  activityType,
  reporter,
  whereResolved,
  resultStatus,
  communicationSummary,
  communicationOutcome,
  analysisSummary,
  analysisConclusion,
  testingScope,
  testingOutcome,
  adminDescription,
  evidenceUrl,
  evidenceFileName,
  hasEvidenceFile,
  steps,
  author,
}: Props) {
  const ordered = [...steps].sort((a, b) => a.sortOrder - b.sortOrder);
  const totalMin = ordered.reduce((s, x) => s + x.minutes, 0);
  const showStepTime = activityUsesSteps(activityType) && ordered.length > 0;

  const analysisHasText = Boolean(
    (analysisSummary && analysisSummary.trim()) || (analysisConclusion && analysisConclusion.trim()),
  );

  return (
    <article className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 p-6">
      {author && (
        <p className="text-sm text-[var(--muted)]">
          Zaměstnanec: <span className="text-[var(--text)]">{author.name}</span> ({author.email})
        </p>
      )}
      <header>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 flex flex-wrap gap-2 text-sm text-[var(--muted)]">
          <span className="rounded-md bg-[var(--bg)] px-2 py-0.5">
            {ACTIVITY_LABEL[activityType]}
          </span>
          <span className="rounded-md bg-[var(--bg)] px-2 py-0.5">
            Výsledek: {RESULT_LABEL[resultStatus]}
          </span>
          <span>
            Datum práce: {workDate.toLocaleDateString("cs-CZ")}
            {showStepTime && ` · součet kroků: ${totalMin} min`}
          </span>
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-medium text-[var(--muted)]">Kdo zadal / nahlásil</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{reporter}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-[var(--muted)]">Kde se to řešilo</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{whereResolved}</p>
        </div>
      </section>

      {activityType === "COMMUNICATION" && (
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-medium text-[var(--muted)]">Souhrn komunikace</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
              {communicationSummary ?? "—"}
            </p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-[var(--muted)]">Výsledek komunikace</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
              {communicationOutcome ?? "—"}
            </p>
          </div>
        </section>
      )}

      {activityType === "ANALYSIS" && (
        <section className="space-y-4">
          {analysisHasText ? (
            <>
              <div>
                <h2 className="text-sm font-medium text-[var(--muted)]">Průběh analýzy</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                  {analysisSummary ?? "—"}
                </p>
              </div>
              <div>
                <h2 className="text-sm font-medium text-[var(--muted)]">Závěr</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                  {analysisConclusion ?? "—"}
                </p>
              </div>
            </>
          ) : (
            <div>
              <h2 className="text-sm font-medium text-[var(--muted)]">Kroky (dřívější zápis)</h2>
              <StepsBlock steps={steps} />
            </div>
          )}
        </section>
      )}

      {activityType === "TESTING" && (
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-medium text-[var(--muted)]">Co bylo testováno</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
              {testingScope ?? "—"}
            </p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-[var(--muted)]">Výsledek testu</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
              {testingOutcome ?? "—"}
            </p>
          </div>
        </section>
      )}

      {activityType === "ADMINISTRATION" && (
        <section>
          <h2 className="text-sm font-medium text-[var(--muted)]">Popis činnosti</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
            {adminDescription ?? "—"}
          </p>
        </section>
      )}

      {activityUsesSteps(activityType) && (
        <section>
          <h2 className="text-sm font-medium text-[var(--muted)]">Kroky práce</h2>
          <StepsBlock steps={steps} />
        </section>
      )}

      {(evidenceUrl || hasEvidenceFile) && (
        <section>
          <h2 className="text-sm font-medium text-[var(--muted)]">Důkaz (volitelné)</h2>
          <ul className="mt-2 list-inside list-disc text-sm">
            {evidenceUrl && (
              <li>
                <a
                  href={evidenceUrl}
                  className="text-[var(--accent)] hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Odkaz: {evidenceUrl}
                </a>
              </li>
            )}
            {hasEvidenceFile && (
              <li>
                <Link
                  href={`/api/entries/${entryId}/evidence`}
                  className="text-[var(--accent)] hover:underline"
                  target="_blank"
                >
                  Příloha: {evidenceFileName ?? "soubor"}
                </Link>
              </li>
            )}
          </ul>
        </section>
      )}

      <p className="text-xs text-[var(--muted)]">
        Jste v režimu pouze ke čtení. Úpravy provádí zaměstnanec u svého záznamu.
      </p>
    </article>
  );
}
