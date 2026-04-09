import { z } from "zod";
import {
  activityUsesAdminFields,
  activityUsesAnalysisFields,
  activityUsesBriefSteps,
  activityUsesCommunicationFields,
  activityUsesSteps,
  activityUsesStrictSteps,
  activityUsesTestingFields,
} from "@/lib/activity-form";

const activityTypeValues = [
  "TECHNICAL",
  "COMMUNICATION",
  "ANALYSIS",
  "SUPPORT",
  "IMPLEMENTATION",
  "TESTING",
  "ADMINISTRATION",
] as const;

const resultStatusValues = ["RESOLVED", "UNRESOLVED", "PENDING"] as const;

export type ActivityTypeValue = (typeof activityTypeValues)[number];
export type ResultStatusValue = (typeof resultStatusValues)[number];

const stepLooseSchema = z.object({
  description: z.string(),
  minutes: z.coerce.number(),
});

function validateStepMinutes(m: number, i: number, ctx: z.RefinementCtx) {
  if (!Number.isFinite(m) || !Number.isInteger(m) || m < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "U každého kroku uveďte čas v minutách (min. 1).",
      path: ["steps", i, "minutes"],
    });
  } else if (m > 720) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Jeden krok nesmí přesáhnout 720 minut (12 h).",
      path: ["steps", i, "minutes"],
    });
  }
}

export const workEntryBodySchema = z
  .object({
    title: z.string().trim().min(1, "Vyplňte, co přesně jste řešili.").max(200),
    activityType: z.enum(activityTypeValues),
    workDate: z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
      message: "Neplatné datum práce.",
    }),
    reporter: z
      .string()
      .trim()
      .min(1, "Vyplňte, kdo zadal nebo nahlásil úkol.")
      .max(500),
    whereResolved: z
      .string()
      .trim()
      .min(1, "Vyplňte, kde se to řešilo (systém, server, lokalita, nástroj…).")
      .max(2000),
    resultStatus: z.enum(resultStatusValues),
    evidenceUrl: z.preprocess(
      (v) => (v === undefined || v === null ? "" : String(v)),
      z
        .string()
        .trim()
        .transform((s) => (s === "" ? undefined : s))
        .refine(
          (s) => s === undefined || z.string().url().safeParse(s).success,
          "Zadejte platnou URL (např. odkaz na screenshot v úložišti).",
        ),
    ),
    steps: z.array(stepLooseSchema).max(50),
    communicationSummary: z.string().optional(),
    communicationOutcome: z.string().optional(),
    analysisSummary: z.string().optional(),
    analysisConclusion: z.string().optional(),
    testingScope: z.string().optional(),
    testingOutcome: z.string().optional(),
    adminDescription: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const t = data.activityType;

    if (activityUsesCommunicationFields(t)) {
      const summary = data.communicationSummary?.trim() ?? "";
      const outcome = data.communicationOutcome?.trim() ?? "";
      if (summary.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Stručně shrňte komunikaci (e-mail, hovor, meeting – s kým, o čem).",
          path: ["communicationSummary"],
        });
      }
      if (outcome.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Uveďte výsledek komunikace (domluva, další krok, odmítnutí…).",
          path: ["communicationOutcome"],
        });
      }
      return;
    }

    if (activityUsesAnalysisFields(t)) {
      const s = data.analysisSummary?.trim() ?? "";
      const c = data.analysisConclusion?.trim() ?? "";
      if (s.length < 40) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Popište průběh analýzy (zdroje dat, kontroly, postup) – alespoň 40 znaků.",
          path: ["analysisSummary"],
        });
      }
      if (c.length < 60) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Závěr analýzy je povinný – nález, doporučení nebo návrh řešení (min. 60 znaků).",
          path: ["analysisConclusion"],
        });
      }
      return;
    }

    if (activityUsesTestingFields(t)) {
      const scope = data.testingScope?.trim() ?? "";
      const out = data.testingOutcome?.trim() ?? "";
      if (scope.length < 30) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Uveďte, co bylo testováno (scénář, modul, oprava) – min. 30 znaků.",
          path: ["testingScope"],
        });
      }
      if (out.length < 15) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Uveďte výsledek testu (prošlo / neprošlo, chyby, poznámky).",
          path: ["testingOutcome"],
        });
      }
      return;
    }

    if (activityUsesAdminFields(t)) {
      const a = data.adminDescription?.trim() ?? "";
      if (a.length < 30) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Stručně ale konkrétně popište administrativní úkon (min. 30 znaků).",
          path: ["adminDescription"],
        });
      }
      return;
    }

    if (!activityUsesSteps(t)) {
      return;
    }

    if (!data.steps.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Přidejte alespoň jeden krok s časem.",
        path: ["steps"],
      });
      return;
    }

    const minLen = activityUsesStrictSteps(t) ? 50 : activityUsesBriefSteps(t) ? 35 : 50;
    const msg =
      minLen >= 50
        ? "U každého kroku alespoň 50 znaků: konkrétní postup, příkaz, ověření, výstup."
        : "U každého kroku alespoň 35 znaků – stručně, ale konkrétně (co bylo provedeno).";

    data.steps.forEach((step, i) => {
      const d = step.description.trim();
      if (d.length < minLen) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: msg,
          path: ["steps", i, "description"],
        });
      }
      validateStepMinutes(step.minutes, i, ctx);
    });
  });

export type WorkEntryBody = z.infer<typeof workEntryBodySchema>;

export const createEmployeeSchema = z.object({
  email: z
    .string()
    .trim()
    .transform((s) => s.toLowerCase())
    .pipe(z.string().email("Neplatný e-mail.")),
  name: z
    .string()
    .trim()
    .min(2, "Jméno musí mít alespoň 2 znaky.")
    .max(120),
  password: z
    .string()
    .min(8, "Heslo musí mít alespoň 8 znaků.")
    .max(200),
});

export type CreateEmployeeBody = z.infer<typeof createEmployeeSchema>;
