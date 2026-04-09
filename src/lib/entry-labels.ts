import type { ActivityType, ResultStatus } from "@prisma/client";

export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  TECHNICAL: "Technická práce",
  COMMUNICATION: "Komunikace",
  ANALYSIS: "Analýza",
  SUPPORT: "Podpora / operativa",
  IMPLEMENTATION: "Implementace",
  TESTING: "Testování",
  ADMINISTRATION: "Administrativa",
};

/** Krátký popis pro nápovědu ve formuláři */
export const ACTIVITY_DESCRIPTION: Record<ActivityType, string> = {
  TECHNICAL:
    "Instalace, konfigurace, opravy, práce se systémy a zařízeními – povinné konkrétní kroky s časem.",
  COMMUNICATION: "E-mail, telefonát, meeting – souhrn s kým a výsledek (bez kroků).",
  ANALYSIS: "Hledání příčin, kontrola dat, návrh – průběh a především závěr.",
  SUPPORT: "Rutinní podpora a údržba – stručné, ale konkrétní kroky s časem (kratší popisy).",
  IMPLEMENTATION: "Nasazení verzí, migrace, nové funkce – kroky nasazení + čas, doplňte výsledek polem „Výsledek“.",
  TESTING: "Co bylo testováno a s jakým výsledkem – bez povinných kroků.",
  ADMINISTRATION: "Fakturace, objednávky, organizace – jeden stručný souvislý popis.",
};

export const RESULT_LABEL: Record<ResultStatus, string> = {
  RESOLVED: "Vyřešeno",
  UNRESOLVED: "Nevyřešeno",
  PENDING: "Stále čeká / rozpracováno",
};
