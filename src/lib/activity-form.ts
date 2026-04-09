/** Typy práce, kde se zapisují kroky s časem (minuty u každého kroku). */
export function activityUsesSteps(activityType: string): boolean {
  return (
    activityType === "TECHNICAL" ||
    activityType === "IMPLEMENTATION" ||
    activityType === "SUPPORT"
  );
}

export function activityUsesCommunicationFields(activityType: string): boolean {
  return activityType === "COMMUNICATION";
}

export function activityUsesAnalysisFields(activityType: string): boolean {
  return activityType === "ANALYSIS";
}

export function activityUsesTestingFields(activityType: string): boolean {
  return activityType === "TESTING";
}

export function activityUsesAdminFields(activityType: string): boolean {
  return activityType === "ADMINISTRATION";
}

/** Přísnější popisy kroků (technika, implementace). */
export function activityUsesStrictSteps(activityType: string): boolean {
  return activityType === "TECHNICAL" || activityType === "IMPLEMENTATION";
}

/** Kratší, ale konkrétní kroky (podpora / operativa). */
export function activityUsesBriefSteps(activityType: string): boolean {
  return activityType === "SUPPORT";
}
