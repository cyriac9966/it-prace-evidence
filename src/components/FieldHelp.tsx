"use client";

import { useId, useState } from "react";

type Props = {
  /** Krátké vysvětlení u pole – co do něj nezapomenout */
  text: string;
};

export function FieldHelp({ text }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        className="ml-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[11px] font-semibold leading-none text-[var(--muted)] outline-none hover:border-[var(--accent)] hover:text-white focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        aria-expanded={open}
        aria-controls={id}
        aria-label="Nápověda k poli"
        onClick={() => setOpen((v) => !v)}
      >
        ?
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-2 w-[min(100vw-2rem,22rem)] rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-xs font-normal leading-relaxed text-[var(--text)] shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}
