import { TaskCard, Task } from './TaskCard';
import { Circle } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  onChecklistToggle: (taskId: string, checklistId: string) => void;
}

interface Column {
  id: 'pending' | 'in-progress' | 'review' | 'completed';
  title: string;
  color: string;
  bgColor: string;
}

export function KanbanBoard({ tasks, onChecklistToggle }: KanbanBoardProps) {
  const columns: Column[] = [
    { 
      id: 'pending', 
      title: 'Pendiente', 
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    { 
      id: 'in-progress', 
      title: 'En Proceso', 
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    { 
      id: 'review', 
      title: 'En Revisión', 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    { 
      id: 'completed', 
      title: 'Completado', 
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
  ];

  const getTasksByStatus = (status: Column['id']) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <div className="grid grid-cols-4 gap-6 h-full">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.id);
        
        return (
          <div key={column.id} className="flex flex-col min-h-0">
            {/* Column Header */}
            <div className={`${column.bgColor} rounded-t-lg px-4 py-3 border-b-2 border-slate-200`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-semibold ${column.color}`}>
                  {column.title}
                </h3>
                <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-full">
                  {columnTasks.length}
                </span>
              </div>
            </div>

            {/* Column Content */}
            <div className="flex-1 bg-slate-50 rounded-b-lg p-4 overflow-y-auto">
              <div className="space-y-4">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onChecklistToggle={onChecklistToggle}
                  />
                ))}
                
                {columnTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Circle className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-sm text-slate-400">
                      No hay tareas en esta columna
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
