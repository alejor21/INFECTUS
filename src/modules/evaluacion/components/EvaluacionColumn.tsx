import { FileDown } from 'lucide-react';
import type { ComplianceValue, ProaSection } from '../data/proaItems';
import { computeSectionScore, getItemKey } from '../data/proaItems';
import { EvaluacionCard } from './EvaluacionCard';
import { ProgressBar } from './ProgressBar';

interface EvaluacionColumnProps {
  section: ProaSection;
  allItemValues: Record<string, ComplianceValue>;
  onItemChange: (key: string, value: ComplianceValue) => void;
  onExportSection?: () => void;
}

const SECTION_COLORS: Record<string, { header: string; badge: string; bar: string }> = {
  pre: {
    header: 'bg-indigo-50 border-indigo-200',
    badge: 'bg-indigo-100 text-indigo-700',
    bar: 'from-indigo-400 to-indigo-600',
  },
  exec: {
    header: 'bg-teal-50 border-teal-200',
    badge: 'bg-teal-100 text-teal-700',
    bar: 'from-teal-400 to-teal-600',
  },
  eval: {
    header: 'bg-violet-50 border-violet-200',
    badge: 'bg-violet-100 text-violet-700',
    bar: 'from-violet-400 to-violet-600',
  },
};

export function EvaluacionColumn({
  section,
  allItemValues,
  onItemChange,
  onExportSection,
}: EvaluacionColumnProps) {
  const score = computeSectionScore(section, allItemValues);
  const progress = Math.round((score / section.maxScore) * 100);
  const colors = SECTION_COLORS[section.id] ?? SECTION_COLORS['pre'];
  const progressBarColor =
    progress > 80
      ? 'from-green-400 to-green-600'
      : progress >= 50
        ? 'from-amber-400 to-amber-600'
        : 'from-red-400 to-red-600';

  const totalItems = section.categories.reduce((sum, cat) => sum + cat.items.length, 0);
  let answeredItems = 0;
  section.categories.forEach((cat, catIdx) => {
    cat.items.forEach((_, itemIdx) => {
      const key = getItemKey(section.id, catIdx, itemIdx);
      if (allItemValues[key] !== undefined) answeredItems++;
    });
  });

  return (
    <div className="flex flex-col min-w-[360px] flex-1 min-h-0">
      {/* Column Header */}
      <div
        className={`rounded-t-xl px-4 py-3 border-b-2 ${colors.header} sticky top-0 z-10`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">{section.title}</h3>
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${colors.badge}`}
          >
            {score} / {section.maxScore} pts
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex-1 mr-3">
            <ProgressBar
              progress={progress}
              size="sm"
              showLabel={false}
              colorClass={progressBarColor}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-400">
              {answeredItems}/{totalItems} evaluados
            </span>
            {onExportSection && (
              <button
                onClick={onExportSection}
                className="flex items-center gap-1 text-xs border border-gray-300 rounded-md px-2 py-0.5 text-gray-600 hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-colors min-h-[44px]"
                title={`Exportar ${section.title}`}
                aria-label={`Exportar ${section.title}`}
              >
                <FileDown className="w-3 h-3" />
                Exportar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 bg-gray-50 rounded-b-xl p-4 overflow-y-auto">
        <div className="space-y-4">
          {section.categories.map((cat, catIdx) => (
            <EvaluacionCard
              key={catIdx}
              sectionId={section.id}
              categoryIdx={catIdx}
              categoryName={cat.name}
              items={cat.items}
              allItemValues={allItemValues}
              onItemChange={onItemChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
