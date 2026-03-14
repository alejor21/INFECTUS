import { Building2, TrendingUp } from 'lucide-react';
import { KanbanBoard } from './KanbanBoard';
import { Task } from './TaskCard';

interface InstitutionViewProps {
  institutionName: string;
  tasks: Task[];
  totalProgress: number;
  proaProgress: number;
  iasProgress: number;
  onChecklistToggle: (taskId: string, checklistId: string) => void;
}

export function InstitutionView({
  institutionName,
  tasks,
  totalProgress,
  proaProgress,
  iasProgress,
  onChecklistToggle,
}: InstitutionViewProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Institution Header */}
      <div className="bg-gradient-to-r from-blue-50 to-slate-50 border-b border-slate-200 px-8 py-6 mb-6">
        <div className="flex items-center justify-between">
          {/* Institution Info */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-7 h-7 text-white" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-slate-800">
                {institutionName}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Vista detallada de cumplimiento
              </p>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center gap-6">
            <div className="text-center px-5 py-3 bg-white rounded-lg border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 mb-1">Total</p>
              <p className="text-2xl font-bold text-blue-600">{totalProgress}%</p>
            </div>
            <div className="text-center px-5 py-3 bg-white rounded-lg border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 mb-1">PROA</p>
              <p className="text-2xl font-bold text-blue-600">{proaProgress}%</p>
            </div>
            <div className="text-center px-5 py-3 bg-white rounded-lg border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 mb-1">IAS</p>
              <p className="text-2xl font-bold text-purple-600">{iasProgress}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 px-8 pb-8 overflow-hidden">
        <KanbanBoard tasks={tasks} onChecklistToggle={onChecklistToggle} />
      </div>
    </div>
  );
}
