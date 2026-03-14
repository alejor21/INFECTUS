import { ChevronDown, Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface HeaderProps {
  selectedInstitution: string;
  onInstitutionChange: (value: string) => void;
  selectedTrimester: string;
  onTrimesterChange: (value: string) => void;
  globalProgress: number;
}

export function Header({
  selectedInstitution,
  onInstitutionChange,
  selectedTrimester,
  onTrimesterChange,
  globalProgress,
}: HeaderProps) {
  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">
          Tablero de Cumplimiento – PROA e IAS
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Seguimiento de guías en instituciones de salud
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Institution Filter */}
        <Select value={selectedInstitution} onValueChange={onInstitutionChange}>
          <SelectTrigger className="w-56 bg-slate-50 border-slate-200 h-11">
            <SelectValue placeholder="Seleccionar institución" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las instituciones</SelectItem>
            <SelectItem value="inst1">Institución 1</SelectItem>
            <SelectItem value="inst2">Institución 2</SelectItem>
            <SelectItem value="inst3">Institución 3</SelectItem>
            <SelectItem value="inst4">Institución 4</SelectItem>
            <SelectItem value="inst5">Institución 5</SelectItem>
            <SelectItem value="inst6">Institución 6</SelectItem>
            <SelectItem value="inst7">Institución 7</SelectItem>
          </SelectContent>
        </Select>

        {/* Trimester Selector */}
        <Select value={selectedTrimester} onValueChange={onTrimesterChange}>
          <SelectTrigger className="w-44 bg-slate-50 border-slate-200 h-11">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Trimestre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Q1-2026">Q1 2026</SelectItem>
            <SelectItem value="Q2-2026">Q2 2026</SelectItem>
            <SelectItem value="Q3-2026">Q3 2026</SelectItem>
            <SelectItem value="Q4-2026">Q4 2026</SelectItem>
          </SelectContent>
        </Select>

        {/* Global Progress Indicator */}
        <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-50 rounded-lg border border-slate-200">
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="#e2e8f0"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="#3b82f6"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - globalProgress / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-700">
              {globalProgress}%
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-500">Cumplimiento</p>
            <p className="text-sm font-semibold text-slate-700">Global</p>
          </div>
        </div>
      </div>
    </header>
  );
}
