import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import type { ComplianceValue } from '../data/proaItems';
import { getItemKey } from '../data/proaItems';
import { ProgressBar } from './ProgressBar';

interface EvaluacionCardProps {
  sectionId: string;
  categoryIdx: number;
  categoryName: string;
  items: readonly string[];
  allItemValues: Record<string, ComplianceValue>;
  onItemChange: (key: string, value: ComplianceValue) => void;
}

const COMPLIANCE_OPTIONS: {
  value: ComplianceValue;
  label: string;
  activeClass: string;
}[] = [
  { value: 'SI', label: 'SI', activeClass: 'bg-green-500 text-white' },
  { value: 'NO', label: 'NO', activeClass: 'bg-red-500 text-white' },
  { value: 'NO_APLICA', label: 'N/A', activeClass: 'bg-gray-400 text-white' },
];

export function EvaluacionCard({
  sectionId,
  categoryIdx,
  categoryName,
  items,
  allItemValues,
  onItemChange,
}: EvaluacionCardProps) {
  const score = items.reduce((acc, _, itemIdx) => {
    const key = getItemKey(sectionId, categoryIdx, itemIdx);
    const val = allItemValues[key];
    return acc + (val === 'SI' || val === 'NO_APLICA' ? 1 : 0);
  }, 0);

  const answeredCount = items.reduce((acc, _, itemIdx) => {
    const key = getItemKey(sectionId, categoryIdx, itemIdx);
    return acc + (allItemValues[key] !== undefined ? 1 : 0);
  }, 0);

  const allPositive =
    items.length > 0 &&
    answeredCount === items.length &&
    items.every((_, itemIdx) => {
      const key = getItemKey(sectionId, categoryIdx, itemIdx);
      const val = allItemValues[key];
      return val === 'SI' || val === 'NO_APLICA';
    });

  const progress = items.length > 0 ? Math.round((score / items.length) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
    >
      {/* Card Header */}
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-800 leading-tight flex-1 min-w-0 mr-2">
          {categoryName}
        </h4>
        <div className="flex items-center gap-1.5 shrink-0">
          {allPositive && <Check className="w-4 h-4 text-green-500" />}
          <span className="text-xs font-medium text-gray-400">
            {answeredCount}/{items.length}
          </span>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-1 mb-4">
        {items.map((item, itemIdx) => {
          const key = getItemKey(sectionId, categoryIdx, itemIdx);
          const currentValue = allItemValues[key];

          return (
            <div
              key={key}
              className={`flex items-start gap-2 py-1 rounded-r border-l-2 pl-1.5 ${
                currentValue === 'NO'
                  ? 'border-red-300 bg-red-50/60'
                  : 'border-transparent'
              }`}
            >
              <span className="flex-1 text-xs text-gray-600 leading-relaxed pt-0.5">
                {item}
              </span>
              <div className="flex shrink-0 rounded-md overflow-hidden border border-gray-200">
                {COMPLIANCE_OPTIONS.map((opt, optIdx) => (
                  <button
                    key={opt.value}
                    onClick={() => onItemChange(key, opt.value)}
                    className={[
                      'min-w-[44px] min-h-[44px] px-2 flex items-center justify-center text-xs font-semibold transition-colors',
                      currentValue === opt.value
                        ? opt.activeClass
                        : 'bg-white text-gray-400 hover:text-gray-700 hover:bg-gray-50',
                      optIdx < COMPLIANCE_OPTIONS.length - 1
                        ? 'border-r border-gray-200'
                        : '',
                    ].join(' ')}
                    aria-label={`${item}: ${opt.value}`}
                    aria-pressed={currentValue === opt.value}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Score Footer */}
      <div className="border-t border-gray-100 pt-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-400">Puntaje categoría</span>
          <span className="text-xs font-semibold text-indigo-600">
            {score} / {items.length}
          </span>
        </div>
        <ProgressBar
          progress={progress}
          size="sm"
          showLabel={false}
          colorClass="from-indigo-400 to-indigo-600"
        />
      </div>
    </motion.div>
  );
}
