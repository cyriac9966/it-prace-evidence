import {
  activityUsesAdminFields,
  activityUsesAnalysisFields,
  activityUsesCommunicationFields,
  activityUsesSteps,
  activityUsesTestingFields,
} from "@/lib/activity-form";
import type { WorkEntryBody } from "@/lib/validation";

export function structuredFieldsFromBody(parsed: WorkEntryBody) {
  const t = parsed.activityType;
  return {
    communicationSummary: activityUsesCommunicationFields(t)
      ? (parsed.communicationSummary?.trim() ?? null)
      : null,
    communicationOutcome: activityUsesCommunicationFields(t)
      ? (parsed.communicationOutcome?.trim() ?? null)
      : null,
    analysisSummary: activityUsesAnalysisFields(t)
      ? (parsed.analysisSummary?.trim() ?? null)
      : null,
    analysisConclusion: activityUsesAnalysisFields(t)
      ? (parsed.analysisConclusion?.trim() ?? null)
      : null,
    testingScope: activityUsesTestingFields(t) ? (parsed.testingScope?.trim() ?? null) : null,
    testingOutcome: activityUsesTestingFields(t) ? (parsed.testingOutcome?.trim() ?? null) : null,
    adminDescription: activityUsesAdminFields(t)
      ? (parsed.adminDescription?.trim() ?? null)
      : null,
  };
}

export function stepsCreateFromBody(parsed: WorkEntryBody) {
  if (!activityUsesSteps(parsed.activityType)) {
    return [];
  }
  return parsed.steps.map((s, i) => ({
    sortOrder: i,
    description: s.description.trim(),
    minutes: Math.round(s.minutes),
  }));
}
