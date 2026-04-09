import type { WorkEntry, WorkStep } from "@prisma/client";

export type EntryWithSteps = WorkEntry & { steps: WorkStep[] };

export function serializeEntry(entry: EntryWithSteps) {
  const steps = [...entry.steps].sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    id: entry.id,
    userId: entry.userId,
    title: entry.title,
    workDate: entry.workDate.toISOString(),
    activityType: entry.activityType,
    reporter: entry.reporter,
    whereResolved: entry.whereResolved,
    resultStatus: entry.resultStatus,
    communicationSummary: entry.communicationSummary,
    communicationOutcome: entry.communicationOutcome,
    analysisSummary: entry.analysisSummary,
    analysisConclusion: entry.analysisConclusion,
    testingScope: entry.testingScope,
    testingOutcome: entry.testingOutcome,
    adminDescription: entry.adminDescription,
    evidenceUrl: entry.evidenceUrl,
    evidenceFileName: entry.evidenceFileName,
    hasEvidenceFile: Boolean(entry.evidenceStoredPath),
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    steps: steps.map((s) => ({
      id: s.id,
      sortOrder: s.sortOrder,
      description: s.description,
      minutes: s.minutes,
    })),
  };
}
