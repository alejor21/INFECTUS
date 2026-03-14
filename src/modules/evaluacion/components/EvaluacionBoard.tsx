import { useState } from 'react';
import type { ComplianceValue } from '../data/proaItems';
import { PROA_SECTIONS } from '../data/proaItems';
import { EvaluacionColumn } from './EvaluacionColumn';

interface EvaluacionBoardProps {
  allItemValues: Record<string, ComplianceValue>;
  onItemChange: (key: string, value: ComplianceValue) => void;
  onExportSection?: (sectionId: string) => void;
}

const SECTION_TAB_LABELS: Record<string, string> = {
  pre: 'Pre',
  exec: 'Ejecución',
  eval: 'Evaluación',
};

export function EvaluacionBoard({
  allItemValues,
  onItemChange,
  onExportSection,
}: EvaluacionBoardProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <div className="flex flex-col h-full">
      {/* Mobile tab switcher */}
      <div className="md:hidden flex items-center gap-1 bg-gray-100 rounded-xl p-1 mb-4 shrink-0">
        {PROA_SECTIONS.map((section, idx) => (
          <button
            key={section.id}
            onClick={() => setActiveIdx(idx)}
            className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors min-h-[44px] ${
              activeIdx === idx
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {SECTION_TAB_LABELS[section.id] ?? section.id}
          </button>
        ))}
      </div>

      {/* Mobile: single active column */}
      <div className="md:hidden flex-1 min-h-0">
        <EvaluacionColumn
          section={PROA_SECTIONS[activeIdx]}
          allItemValues={allItemValues}
          onItemChange={onItemChange}
          onExportSection={onExportSection ? () => onExportSection(PROA_SECTIONS[activeIdx].id) : undefined}
        />
      </div>

      {/* Desktop: all columns side by side */}
      <div className="hidden md:flex gap-6 h-full overflow-x-auto pb-2">
        {PROA_SECTIONS.map((section) => (
          <EvaluacionColumn
            key={section.id}
            section={section}
            allItemValues={allItemValues}
            onItemChange={onItemChange}
            onExportSection={onExportSection ? () => onExportSection(section.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
