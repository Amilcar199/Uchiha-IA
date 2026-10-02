import { buildDiagnosis, readingLevelLabel, type ReadingLevel } from "@/engines/decision/diagnosis";
import type { Marking } from "@/domain/rules/types";

const TONE: Record<ReadingLevel, string> = {
  observado: "text-[#d4d4d8]",
  interpretado: "text-white",
  nao_confirmado: "text-amber-100",
};

export function DiagnosisReport(input: Parameters<typeof buildDiagnosis>[0]) {
  const sections = buildDiagnosis(input);

  return (
    <div className="mt-6 grid gap-4">
      {sections.map((section) => (
        <section key={section.title} className="surface p-5">
          <h2 className="text-sm font-medium">{section.title}</h2>
          <ul className="mt-3 grid gap-3">
            {section.items.map((item) => (
              <li key={`${section.title}-${item.text}`} className="text-sm leading-6">
                <span className={`mr-2 text-xs font-semibold tracking-wide uppercase ${TONE[item.level]}`}>
                  {readingLevelLabel(item.level)}
                </span>
                <span className="text-[#d4d4d8]">{item.text}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
