import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EntryForm } from "@/components/EntryForm";
import { WorkEntryReadOnly } from "@/components/WorkEntryReadOnly";

type Props = { params: Promise<{ id: string }> };

export default async function PraceDetailPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user) return null;
  const { id } = await params;

  if (user.role === "ADMIN") {
    const entry = await prisma.workEntry.findFirst({
      where: { id },
      include: {
        steps: true,
        user: { select: { name: true, email: true } },
      },
    });
    if (!entry) notFound();

    return (
      <div className="space-y-6">
        <div>
          <Link href="/prace" className="text-sm text-[var(--muted)] hover:text-white">
            ← Zpět na záznamy týmů
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Detail záznamu (náhled)</h1>
        </div>
        <WorkEntryReadOnly
          entryId={entry.id}
          title={entry.title}
          workDate={entry.workDate}
          activityType={entry.activityType}
          reporter={entry.reporter}
          whereResolved={entry.whereResolved}
          resultStatus={entry.resultStatus}
          communicationSummary={entry.communicationSummary}
          communicationOutcome={entry.communicationOutcome}
          analysisSummary={entry.analysisSummary}
          analysisConclusion={entry.analysisConclusion}
          testingScope={entry.testingScope}
          testingOutcome={entry.testingOutcome}
          adminDescription={entry.adminDescription}
          evidenceUrl={entry.evidenceUrl}
          evidenceFileName={entry.evidenceFileName}
          hasEvidenceFile={Boolean(entry.evidenceStoredPath)}
          steps={entry.steps}
          author={entry.user}
        />
      </div>
    );
  }

  const entry = await prisma.workEntry.findFirst({
    where: { id, userId: user.id },
    include: { steps: true },
  });

  if (!entry) notFound();

  const steps = [...entry.steps]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s) => ({ description: s.description, minutes: String(s.minutes) }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/prace" className="text-sm text-[var(--muted)] hover:text-white">
          ← Zpět na seznam
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Upravit záznam</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Úpravy jsou uloženy včetně předchozí verze v auditním logu (vidí jen administrátor).
        </p>
      </div>
      <EntryForm
        mode="edit"
        entryId={entry.id}
        initialTitle={entry.title}
        initialWorkDate={entry.workDate.toISOString()}
        initialActivityType={entry.activityType}
        initialReporter={entry.reporter}
        initialWhereResolved={entry.whereResolved}
        initialResultStatus={entry.resultStatus}
        initialCommunicationSummary={entry.communicationSummary ?? ""}
        initialCommunicationOutcome={entry.communicationOutcome ?? ""}
        initialAnalysisSummary={entry.analysisSummary ?? ""}
        initialAnalysisConclusion={entry.analysisConclusion ?? ""}
        initialTestingScope={entry.testingScope ?? ""}
        initialTestingOutcome={entry.testingOutcome ?? ""}
        initialAdminDescription={entry.adminDescription ?? ""}
        initialEvidenceUrl={entry.evidenceUrl ?? ""}
        initialHasEvidenceFile={Boolean(entry.evidenceStoredPath)}
        initialEvidenceFileName={entry.evidenceFileName}
        initialSteps={steps}
      />
    </div>
  );
}
