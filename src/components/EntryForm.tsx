"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FieldHelp } from "@/components/FieldHelp";
import type { ActivityTypeValue, ResultStatusValue } from "@/lib/validation";
import {
  activityUsesBriefSteps,
  activityUsesSteps,
  activityUsesStrictSteps,
} from "@/lib/activity-form";
import { ACTIVITY_DESCRIPTION, ACTIVITY_LABEL } from "@/lib/entry-labels";
import { WARN_ENTRY_TOTAL_MINUTES, WARN_STEP_MINUTES } from "@/lib/time-thresholds";

export type StepDraft = { description: string; minutes: string };

const ACTIVITY_ORDER: ActivityTypeValue[] = [
  "TECHNICAL",
  "SUPPORT",
  "COMMUNICATION",
  "ANALYSIS",
  "IMPLEMENTATION",
  "TESTING",
  "ADMINISTRATION",
];

type Props = {
  mode: "create" | "edit";
  entryId?: string;
  initialTitle?: string;
  initialWorkDate?: string;
  initialActivityType?: ActivityTypeValue;
  initialReporter?: string;
  initialWhereResolved?: string;
  initialResultStatus?: ResultStatusValue;
  initialCommunicationSummary?: string;
  initialCommunicationOutcome?: string;
  initialAnalysisSummary?: string;
  initialAnalysisConclusion?: string;
  initialTestingScope?: string;
  initialTestingOutcome?: string;
  initialAdminDescription?: string;
  initialEvidenceUrl?: string;
  initialHasEvidenceFile?: boolean;
  initialEvidenceFileName?: string | null;
  initialSteps?: StepDraft[];
};

const PLACEHOLDER_TITLE =
  "Např.: Obnova VPN pro uživatele j.novak – notebook Dell Latitude, ticket INC004321";

const HELP_RESOLVED =
  "Vyberte reálný stav: hotovo a předáno, zamítnuto / nevyřešeno, nebo stále čekáte na někoho jiného nebo na podklad.";

const HELP_ACTIVITY =
  "Vyberte typ, který nejlépe vystihuje práci – podle něj se změní povinná pole. Najeďte myší na položku v seznamu pro krátký popis typu.";

const HELP_REPORTER =
  "Jméno nebo tým zadavatele, odkud požadavek přišel (např. vedoucí provozu, zákazník XY, helpdesk).";

const HELP_WHERE =
  "Konkrétní místo: server, aplikace, URL, síť, lokalita – ať je později jasné, kde se práce odehrála.";

const HELP_COMM_SUMMARY =
  "Forma komunikace (e-mail, hovor, meeting), s kým, hlavní téma. Stačí stručně, ale konkrétně.";

const HELP_COMM_OUTCOME =
  "Co z komunikace vyplynulo: schválení, odmítnutí, termín další akce, předání jinému týmu…";

const HELP_ANALYSIS_SUMMARY =
  "Jak jste postupovali: jaká data jste kontrolovali, co jste ověřovali, případně otestovali.";

const HELP_ANALYSIS_CONCLUSION =
  "Hlavní část záznamu: nález, příčina, doporučení nebo navrhované řešení – musí být dohledatelné zpětně.";

const HELP_TESTING_SCOPE =
  "Co přesně jste ověřovali (modul, scénář, oprava po nasazení…).";

const HELP_TESTING_OUTCOME =
  "Výsledek: prošlo / neprošlo, číslo chyby, co je potřeba opravit nebo znovu otestovat.";

const HELP_ADMIN =
  "Např. vystavení faktury, objednávka licencí, plánování schůzky – stručně, ale tak, aby bylo jasné, co bylo hotovo.";

const HELP_EVIDENCE_URL =
  "Volitelně odkaz na screenshot, log nebo soubor v úložišti (SharePoint, ticket…). Soubor můžete také nahrát níže.";

const HELP_STEP_STRICT =
  "Minimálně 50 znaků: co přesně jste udělali (příkaz, obrazovka, ověření), jaký byl výstup. Bez obecných frází typu „opraveno“.";

const HELP_STEP_BRIEF =
  "Minimálně 35 znaků – stručněji než u technické práce, ale stále konkrétně (co bylo provedeno, u koho, kde).";

const emptySteps = (): StepDraft[] => [{ description: "", minutes: "" }];

export function EntryForm({
  mode,
  entryId,
  initialTitle = "",
  initialWorkDate,
  initialActivityType = "TECHNICAL",
  initialReporter = "",
  initialWhereResolved = "",
  initialResultStatus = "PENDING",
  initialCommunicationSummary = "",
  initialCommunicationOutcome = "",
  initialAnalysisSummary = "",
  initialAnalysisConclusion = "",
  initialTestingScope = "",
  initialTestingOutcome = "",
  initialAdminDescription = "",
  initialEvidenceUrl = "",
  initialHasEvidenceFile = false,
  initialEvidenceFileName = null,
  initialSteps,
}: Props) {
  const router = useRouter();
  const defaultDate = useMemo(() => {
    if (initialWorkDate) return initialWorkDate.slice(0, 10);
    return new Date().toISOString().slice(0, 10);
  }, [initialWorkDate]);

  const [title, setTitle] = useState(initialTitle);
  const [workDate, setWorkDate] = useState(defaultDate);
  const [activityType, setActivityType] = useState<ActivityTypeValue>(initialActivityType);
  const [reporter, setReporter] = useState(initialReporter);
  const [whereResolved, setWhereResolved] = useState(initialWhereResolved);
  const [resultStatus, setResultStatus] = useState<ResultStatusValue>(initialResultStatus);
  const [communicationSummary, setCommunicationSummary] = useState(initialCommunicationSummary);
  const [communicationOutcome, setCommunicationOutcome] = useState(initialCommunicationOutcome);
  const [analysisSummary, setAnalysisSummary] = useState(initialAnalysisSummary);
  const [analysisConclusion, setAnalysisConclusion] = useState(initialAnalysisConclusion);
  const [testingScope, setTestingScope] = useState(initialTestingScope);
  const [testingOutcome, setTestingOutcome] = useState(initialTestingOutcome);
  const [adminDescription, setAdminDescription] = useState(initialAdminDescription);
  const [evidenceUrl, setEvidenceUrl] = useState(initialEvidenceUrl);
  const [steps, setSteps] = useState<StepDraft[]>(
    initialSteps && initialSteps.length >= 1 ? initialSteps : emptySteps(),
  );
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [hasEvidenceFile, setHasEvidenceFile] = useState(initialHasEvidenceFile);
  const [evidenceFileName, setEvidenceFileName] = useState(initialEvidenceFileName);

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
  const [loading, setLoading] = useState(false);

  const usesSteps = activityUsesSteps(activityType);

  const stepMinutesList = steps.map((s) => {
    const n = s.minutes === "" ? 0 : Number(s.minutes);
    return Number.isFinite(n) ? n : 0;
  });
  const totalStepMinutes = stepMinutesList.reduce((a, b) => a + b, 0);

  const timeWarnings: string[] = [];
  if (usesSteps) {
    stepMinutesList.forEach((m, i) => {
      if (m >= WARN_STEP_MINUTES) {
        timeWarnings.push(
          `Krok ${i + 1}: ${m} min je neobvykle dlouhý úsek — zkontrolujte, zda nejde rozdělit nebo upřesnit.`,
        );
      }
    });
    if (totalStepMinutes >= WARN_ENTRY_TOTAL_MINUTES) {
      timeWarnings.push(
        `Součet času (${totalStepMinutes} min) přesahuje běžný rozsah jednoho záznamu — ověřte správnost.`,
      );
    }
  }

  function addStep() {
    setSteps((s) => [...s, { description: "", minutes: "" }]);
  }

  function removeStep(index: number) {
    setSteps((s) => (s.length <= 1 ? s : s.filter((_, i) => i !== index)));
  }

  function updateStep(index: number, patch: Partial<StepDraft>) {
    setSteps((s) => s.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function buildJsonBody() {
    const base = {
      title,
      activityType,
      workDate: new Date(workDate).toISOString(),
      reporter,
      whereResolved,
      resultStatus,
      evidenceUrl: evidenceUrl.trim() || undefined,
      communicationSummary,
      communicationOutcome,
      analysisSummary,
      analysisConclusion,
      testingScope,
      testingOutcome,
      adminDescription,
      steps: usesSteps
        ? steps.map((s) => ({
            description: s.description,
            minutes: s.minutes === "" ? 0 : Number(s.minutes),
          }))
        : [],
    };
    return base;
  }

  async function uploadEvidenceIfNeeded(id: string) {
    if (!pendingFile) return;
    const name = pendingFile.name;
    const fd = new FormData();
    fd.append("file", pendingFile);
    const up = await fetch(`/api/entries/${id}/evidence`, { method: "POST", body: fd });
    if (!up.ok) {
      const j = (await up.json()) as { error?: string };
      throw new Error(j.error ?? "Nahrání přílohy selhalo.");
    }
    setPendingFile(null);
    setHasEvidenceFile(true);
    setEvidenceFileName(name);
  }

  async function submit() {
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      const body = buildJsonBody();
      const url = mode === "create" ? "/api/entries" : `/api/entries/${entryId}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        error?: string;
        fields?: Record<string, string[] | undefined>;
        issues?: { path: string; message: string }[];
        entry?: { id: string };
      };
      if (!res.ok) {
        if (data.fields) setFieldErrors(data.fields);
        if (data.issues?.length) {
          setError(data.issues.map((i) => `${i.message}`).join("\n"));
        } else {
          setError(data.error ?? "Uložení selhalo.");
        }
        return;
      }
      const id = data.entry?.id ?? entryId;
      if (id && pendingFile) {
        try {
          await uploadEvidenceIfNeeded(id);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Příloha se nepodařila nahrát.");
          return;
        }
      }
      router.push("/prace");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function removeEvidenceFile() {
    if (!entryId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/entries/${entryId}/evidence`, { method: "DELETE" });
      if (!res.ok) return;
      setHasEvidenceFile(false);
      setEvidenceFileName(null);
      setPendingFile(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function removeEntry() {
    if (!entryId) return;
    if (!window.confirm("Opravdu smazat tento záznam? Akce je zaznamenána v auditním logu.")) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/entries/${entryId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Mazání selhalo.");
        return;
      }
      router.push("/prace");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const fieldHint = (key: string) => {
    const v = fieldErrors[key];
    if (!v?.length) return null;
    return <p className="mt-1 text-xs text-red-300">{v.join(" ")}</p>;
  };

  const stepHelpText = activityUsesStrictSteps(activityType)
    ? HELP_STEP_STRICT
    : activityUsesBriefSteps(activityType)
      ? HELP_STEP_BRIEF
      : HELP_STEP_STRICT;

  return (
    <div className="space-y-6">
      {error && (
        <p className="whitespace-pre-line rounded-md border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      <div>
        <div className="mb-1 flex flex-wrap items-center gap-1">
          <label className="text-sm text-[var(--muted)]" htmlFor="entry-title">
            Co přesně jsi řešil?
          </label>
          <FieldHelp text="Jedna věta nebo krátká věta: konkrétní problém nebo úkol, ideálně s ticketem, zařízením nebo systémem. Vyhněte se obecnému „údržba“." />
        </div>
        <input
          id="entry-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={PLACEHOLDER_TITLE}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white outline-none placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
        />
        {fieldHint("title")}
      </div>

      <div>
        <div className="mb-1 flex flex-wrap items-center gap-1">
          <label className="text-sm text-[var(--muted)]" htmlFor="entry-activity">
            Typ činnosti
          </label>
          <FieldHelp text={HELP_ACTIVITY} />
        </div>
        <select
          id="entry-activity"
          value={activityType}
          onChange={(e) => setActivityType(e.target.value as ActivityTypeValue)}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
        >
          {ACTIVITY_ORDER.map((v) => (
            <option key={v} value={v} title={ACTIVITY_DESCRIPTION[v]}>
              {ACTIVITY_LABEL[v]}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-[var(--muted)]">{ACTIVITY_DESCRIPTION[activityType]}</p>
        {fieldHint("activityType")}
      </div>

      <div>
        <div className="mb-1 flex flex-wrap items-center gap-1">
          <label className="text-sm text-[var(--muted)]" htmlFor="entry-date">
            Datum práce
          </label>
          <FieldHelp text="Den, kdy práce reálně proběhla (ne nutně dnešek, pokud dopisujete později)." />
        </div>
        <input
          id="entry-date"
          type="date"
          value={workDate}
          onChange={(e) => setWorkDate(e.target.value)}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
        />
        {fieldHint("workDate")}
      </div>

      <div>
        <div className="mb-1 flex flex-wrap items-center gap-1">
          <label className="text-sm text-[var(--muted)]" htmlFor="entry-reporter">
            Kdo zadal / nahlásil
          </label>
          <FieldHelp text={HELP_REPORTER} />
        </div>
        <input
          id="entry-reporter"
          value={reporter}
          onChange={(e) => setReporter(e.target.value)}
          placeholder="Např.: Helpdesk, J. Novák – provoz"
          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white outline-none placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
        />
        {fieldHint("reporter")}
      </div>

      <div>
        <div className="mb-1 flex flex-wrap items-center gap-1">
          <label className="text-sm text-[var(--muted)]" htmlFor="entry-where">
            Kde se to řešilo
          </label>
          <FieldHelp text={HELP_WHERE} />
        </div>
        <textarea
          id="entry-where"
          value={whereResolved}
          onChange={(e) => setWhereResolved(e.target.value)}
          rows={3}
          placeholder="Např.: VPN brána fw01, Windows 11 klient, aplikace SAP PRD, pobočka Brno…"
          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white outline-none placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
        />
        {fieldHint("whereResolved")}
      </div>

      <div>
        <div className="mb-1 flex flex-wrap items-center gap-1">
          <label className="text-sm text-[var(--muted)]" htmlFor="entry-result">
            Výsledek
          </label>
          <FieldHelp text={HELP_RESOLVED} />
        </div>
        <select
          id="entry-result"
          value={resultStatus}
          onChange={(e) => setResultStatus(e.target.value as ResultStatusValue)}
          className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
        >
          <option value="RESOLVED">Vyřešeno</option>
          <option value="UNRESOLVED">Nevyřešeno</option>
          <option value="PENDING">Stále čeká / rozpracováno</option>
        </select>
        {fieldHint("resultStatus")}
      </div>

      {activityType === "COMMUNICATION" && (
        <section className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 p-4">
          <h2 className="text-lg font-medium">Komunikace</h2>
          <p className="text-sm text-[var(--muted)]">
            Bez kroků – stačí souhrn a výsledek (e-mail, hovor, schůzka).
          </p>
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-1">
              <label className="text-sm text-[var(--muted)]" htmlFor="comm-sum">
                Souhrn komunikace
              </label>
              <FieldHelp text={HELP_COMM_SUMMARY} />
            </div>
            <textarea
              id="comm-sum"
              value={communicationSummary}
              onChange={(e) => setCommunicationSummary(e.target.value)}
              rows={5}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
            />
            {fieldHint("communicationSummary")}
          </div>
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-1">
              <label className="text-sm text-[var(--muted)]" htmlFor="comm-out">
                Výsledek komunikace
              </label>
              <FieldHelp text={HELP_COMM_OUTCOME} />
            </div>
            <textarea
              id="comm-out"
              value={communicationOutcome}
              onChange={(e) => setCommunicationOutcome(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
            />
            {fieldHint("communicationOutcome")}
          </div>
        </section>
      )}

      {activityType === "ANALYSIS" && (
        <section className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 p-4">
          <h2 className="text-lg font-medium">Analýza</h2>
          <p className="text-sm text-[var(--muted)]">
            Důležitý je zejména závěr; průběh popište tak, aby šlo ověřit postup.
          </p>
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-1">
              <label className="text-sm text-[var(--muted)]" htmlFor="ana-sum">
                Průběh / podklady
              </label>
              <FieldHelp text={HELP_ANALYSIS_SUMMARY} />
            </div>
            <textarea
              id="ana-sum"
              value={analysisSummary}
              onChange={(e) => setAnalysisSummary(e.target.value)}
              rows={5}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
            />
            {fieldHint("analysisSummary")}
          </div>
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-1">
              <label className="text-sm text-[var(--muted)]" htmlFor="ana-conc">
                Závěr
              </label>
              <FieldHelp text={HELP_ANALYSIS_CONCLUSION} />
            </div>
            <textarea
              id="ana-conc"
              value={analysisConclusion}
              onChange={(e) => setAnalysisConclusion(e.target.value)}
              rows={5}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
            />
            {fieldHint("analysisConclusion")}
          </div>
        </section>
      )}

      {activityType === "TESTING" && (
        <section className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 p-4">
          <h2 className="text-lg font-medium">Testování</h2>
          <p className="text-sm text-[var(--muted)]">
            Uveďte rozsah testu a výsledek – bez povinných časovaných kroků.
          </p>
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-1">
              <label className="text-sm text-[var(--muted)]" htmlFor="test-scope">
                Co bylo testováno
              </label>
              <FieldHelp text={HELP_TESTING_SCOPE} />
            </div>
            <textarea
              id="test-scope"
              value={testingScope}
              onChange={(e) => setTestingScope(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
            />
            {fieldHint("testingScope")}
          </div>
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-1">
              <label className="text-sm text-[var(--muted)]" htmlFor="test-out">
                Výsledek testu
              </label>
              <FieldHelp text={HELP_TESTING_OUTCOME} />
            </div>
            <textarea
              id="test-out"
              value={testingOutcome}
              onChange={(e) => setTestingOutcome(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
            />
            {fieldHint("testingOutcome")}
          </div>
        </section>
      )}

      {activityType === "ADMINISTRATION" && (
        <section className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 p-4">
          <h2 className="text-lg font-medium">Administrativa</h2>
          <p className="text-sm text-[var(--muted)]">
            Jedna souvislá poznámka – fakturace, objednávky, organizace (ne čistě technická práce).
          </p>
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-1">
              <label className="text-sm text-[var(--muted)]" htmlFor="admin-desc">
                Popis činnosti
              </label>
              <FieldHelp text={HELP_ADMIN} />
            </div>
            <textarea
              id="admin-desc"
              value={adminDescription}
              onChange={(e) => setAdminDescription(e.target.value)}
              rows={6}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
            />
            {fieldHint("adminDescription")}
          </div>
        </section>
      )}

      {usesSteps && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              <h2 className="text-lg font-medium">Kroky práce</h2>
              <FieldHelp
                text={
                  activityType === "IMPLEMENTATION"
                    ? "Popište kroky nasazení nebo migrace (co kde proběhlo, ověření). U výsledku stavu použijte také pole „Výsledek“ nahoře."
                    : "Každý krok = úsek práce s vlastním časem. Požadavky na délku popisu závisí na typu (technika / implementace vs. podpora)."
                }
              />
            </div>
            <button
              type="button"
              onClick={addStep}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              + Přidat krok
            </button>
          </div>
          {fieldHint("steps")}
          {totalStepMinutes > 0 && (
            <p className="text-sm text-[var(--muted)]">
              Celkový čas (součet kroků):{" "}
              <span className="font-medium text-[var(--text)]">{totalStepMinutes} min</span>
            </p>
          )}
          {timeWarnings.length > 0 && (
            <ul className="list-inside list-disc rounded-md border border-amber-900/40 bg-amber-950/25 px-3 py-2 text-sm text-amber-100">
              {timeWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
          <ol className="space-y-4">
            {steps.map((step, i) => (
              <li
                key={i}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface)]/80 p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[var(--muted)]">Krok {i + 1}</span>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStep(i)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Odebrat
                    </button>
                  )}
                </div>
                <div className="mb-1 flex flex-wrap items-center gap-1">
                  <label className="block text-xs text-[var(--muted)]">Popis kroku</label>
                  <FieldHelp text={stepHelpText} />
                </div>
                <textarea
                  value={step.description}
                  onChange={(e) => updateStep(i, { description: e.target.value })}
                  rows={3}
                  className="mb-3 w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]"
                />
                <div className="mb-1 flex flex-wrap items-center gap-1">
                  <label className="block text-xs text-[var(--muted)]">Čas (minuty)</label>
                  <FieldHelp text="Minuty jen u tohoto kroku. Neobvykle dlouhé úseky systém zvýrazní." />
                </div>
                <input
                  type="number"
                  min={1}
                  max={720}
                  value={step.minutes}
                  onChange={(e) => updateStep(i, { minutes: e.target.value })}
                  className="w-32 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white outline-none focus:border-[var(--accent)]"
                />
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="space-y-3 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)]/30 p-4">
        <h2 className="text-sm font-medium text-[var(--muted)]">Důkaz (volitelné)</h2>
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-1">
            <label className="text-sm text-[var(--muted)]" htmlFor="evidence-url">
              Odkaz
            </label>
            <FieldHelp text={HELP_EVIDENCE_URL} />
          </div>
          <input
            id="evidence-url"
            type="url"
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white outline-none placeholder:text-[var(--muted)]/60 focus:border-[var(--accent)]"
          />
          {fieldHint("evidenceUrl")}
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--muted)]" htmlFor="evidence-file">
            Soubor (screenshot, log, PDF…)
          </label>
          <input
            id="evidence-file"
            type="file"
            accept="image/*,.pdf,.txt,text/plain"
            className="text-sm text-[var(--muted)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--accent)] file:px-3 file:py-1.5 file:text-sm file:text-white"
            onChange={(e) => setPendingFile(e.target.files?.[0] ?? null)}
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            Max. 8 MB. Po uložení záznamu se soubor nahraje. Není povinný.
          </p>
          {mode === "edit" && entryId && hasEvidenceFile && (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <a
                href={`/api/entries/${entryId}/evidence`}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--accent)] hover:underline"
              >
                Aktuální příloha: {evidenceFileName ?? "soubor"}
              </a>
              <button
                type="button"
                className="text-red-400 hover:underline"
                onClick={() => void removeEvidenceFile()}
              >
                Odstranit přílohu
              </button>
            </div>
          )}
          {pendingFile && (
            <p className="mt-2 text-xs text-[var(--muted)]">
              K nahrání: {pendingFile.name} ({Math.round(pendingFile.size / 1024)} kB)
            </p>
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => void submit()}
          className="rounded-md bg-[var(--accent)] px-5 py-2 font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {loading ? "Ukládám…" : mode === "create" ? "Uložit záznam" : "Uložit změny"}
        </button>
        {mode === "edit" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => void removeEntry()}
            className="rounded-md border border-red-900/50 px-5 py-2 text-red-300 hover:bg-red-950/30 disabled:opacity-50"
          >
            Smazat záznam
          </button>
        )}
      </div>
    </div>
  );
}
