import { Calendar, User, Circle, CheckCircle2 } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { Checkbox } from './ui/checkbox';

export interface Task {
  id: string;
  institution: string;
  type: 'PROA' | 'IAS';
  title: string;
  progress: number;
  checklist: {
    id: string;
    label: string;
    completed: boolean;
  }[];
  deadline: string;
  responsible: string;
  status: 'pending' | 'in-progress' | 'review' | 'completed';
}

interface TaskCardProps {
  task: Task;
  onChecklistToggle: (taskId: string, checklistId: string) => void;
}

export function TaskCard({ task, onChecklistToggle }: TaskCardProps) {
  const typeColors = {
    PROA: 'bg-blue-50 text-blue-700 border-blue-200',
    IAS: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const statusColors = {
    pending: 'border-orange-200 bg-orange-50/30',
    'in-progress': 'border-amber-200 bg-amber-50/30',
    review: 'border-blue-200 bg-blue-50/30',
    completed: 'border-green-200 bg-green-50/30',
  };

  return (
    <div className={`bg-white rounded-lg border ${statusColors[task.status]} p-4 shadow-sm hover:shadow-md transition-shadow duration-200`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500 mb-1">
            {task.institution}
          </p>
          <h3 className="text-sm font-semibold text-slate-800 leading-tight">
            {task.title}
          </h3>
        </div>
        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${typeColors[task.type]}`}>
          {task.type}
        </span>
      </div>

      {/* Checklist */}
      <div className="space-y-2 mb-4">
        {task.checklist.map((item) => (
          <div key={item.id} className="flex items-start gap-2">
            <Checkbox
              id={`${task.id}-${item.id}`}
              checked={item.completed}
              onCheckedChange={() => onChecklistToggle(task.id, item.id)}
              className="mt-0.5"
            />
            <label
              htmlFor={`${task.id}-${item.id}`}
              className={`text-xs cursor-pointer ${
                item.completed ? 'line-through text-slate-400' : 'text-slate-600'
              }`}
            >
              {item.label}
            </label>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <ProgressBar progress={task.progress} size="sm" showLabel={false} />
        <p className="text-xs text-slate-500 mt-1.5">
          Progreso: {task.progress}%
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>{task.deadline}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <User className="w-3.5 h-3.5" />
          <span>{task.responsible}</span>
        </div>
      </div>
    </div>
  );
}
