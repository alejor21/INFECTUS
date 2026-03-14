import { Syringe, Activity, FileCheck, TrendingUp, AlertTriangle, CheckCircle2, Heart } from 'lucide-react';
import { initialTasks } from '../data/mockData';
import { TaskCard } from '../components/TaskCard';
import { useState } from 'react';

export function IAS() {
  const iasTasks = initialTasks.filter(task => task.type === 'IAS');
  const [tasks, setTasks] = useState(iasTasks);

  const handleChecklistToggle = (taskId: string, checklistId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === taskId) {
          const updatedChecklist = task.checklist.map(item =>
            item.id === checklistId ? { ...item, completed: !item.completed } : item
          );
          
          const completedCount = updatedChecklist.filter(item => item.completed).length;
          const progress = Math.round((completedCount / updatedChecklist.length) * 100);
          
          return {
            ...task,
            checklist: updatedChecklist,
            progress,
          };
        }
        return task;
      })
    );
  };

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const averageProgress = Math.round(
    tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length
  );

  return (
    <>
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 border-b border-purple-800 px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
            <Syringe className="w-9 h-9 text-white" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">IAS</h2>
            <p className="text-purple-100 mt-1">
              Infecciones Asociadas a la Atención en Salud
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-5 py-4 border border-white/20">
            <p className="text-purple-100 text-sm mb-1">Total Actividades</p>
            <p className="text-3xl font-bold text-white">{tasks.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-5 py-4 border border-white/20">
            <p className="text-purple-100 text-sm mb-1">Completadas</p>
            <p className="text-3xl font-bold text-white">{completedTasks}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-5 py-4 border border-white/20">
            <p className="text-purple-100 text-sm mb-1">En Proceso</p>
            <p className="text-3xl font-bold text-white">{inProgressTasks}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-5 py-4 border border-white/20">
            <p className="text-purple-100 text-sm mb-1">Progreso Promedio</p>
            <p className="text-3xl font-bold text-white">{averageProgress}%</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
        {/* Key Components */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Componentes Clave del Programa IAS
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-slate-800 mb-2">Prevención de Infecciones</h4>
              <p className="text-sm text-slate-600">
                Implementación de protocolos de higiene y bioseguridad para reducir IAAS
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-slate-800 mb-2">Vigilancia Epidemiológica</h4>
              <p className="text-sm text-slate-600">
                Monitoreo continuo de infecciones nosocomiales y análisis de tendencias
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
                <FileCheck className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-slate-800 mb-2">Control de Brotes</h4>
              <p className="text-sm text-slate-600">
                Protocolos de actuación rápida ante detección de brotes infecciosos
              </p>
            </div>
          </div>
        </div>

        {/* Tasks by Status */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Actividades IAS por Estado
          </h3>

          {/* Completed */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-slate-700">Completadas ({completedTasks})</h4>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {tasks
                .filter(t => t.status === 'completed')
                .map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onChecklistToggle={handleChecklistToggle}
                  />
                ))}
            </div>
          </div>

          {/* Review */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <FileCheck className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-slate-700">
                En Revisión ({tasks.filter(t => t.status === 'review').length})
              </h4>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {tasks
                .filter(t => t.status === 'review')
                .map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onChecklistToggle={handleChecklistToggle}
                  />
                ))}
            </div>
          </div>

          {/* In Progress */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-amber-600" />
              <h4 className="font-semibold text-slate-700">En Proceso ({inProgressTasks})</h4>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {tasks
                .filter(t => t.status === 'in-progress')
                .map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onChecklistToggle={handleChecklistToggle}
                  />
                ))}
            </div>
          </div>

          {/* Pending */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h4 className="font-semibold text-slate-700">Pendientes ({pendingTasks})</h4>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {tasks
                .filter(t => t.status === 'pending')
                .map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onChecklistToggle={handleChecklistToggle}
                  />
                ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
