import { useState } from 'react';
import { Header } from '../components/Header';
import { KanbanBoard } from '../components/KanbanBoard';
import { InstitutionView } from '../components/InstitutionView';
import { Task } from '../components/TaskCard';
import { initialTasks } from '../data/mockData';

export function TableroGeneral() {
  const [selectedInstitution, setSelectedInstitution] = useState('todas');
  const [selectedTrimester, setSelectedTrimester] = useState('Q1-2026');
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  // Calculate global progress
  const calculateGlobalProgress = () => {
    if (tasks.length === 0) return 0;
    const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
    return Math.round(totalProgress / tasks.length);
  };

  // Filter tasks by institution
  const getFilteredTasks = () => {
    if (selectedInstitution === 'todas') return tasks;
    return tasks.filter(task => {
      const institutionNumber = task.institution.match(/\d+/)?.[0];
      return selectedInstitution === `inst${institutionNumber}`;
    });
  };

  // Calculate institution-specific progress
  const calculateInstitutionProgress = (filteredTasks: Task[]) => {
    if (filteredTasks.length === 0) return { total: 0, proa: 0, ias: 0 };
    
    const proaTasks = filteredTasks.filter(t => t.type === 'PROA');
    const iasTasks = filteredTasks.filter(t => t.type === 'IAS');
    
    const totalProgress = Math.round(
      filteredTasks.reduce((sum, task) => sum + task.progress, 0) / filteredTasks.length
    );
    
    const proaProgress = proaTasks.length > 0
      ? Math.round(proaTasks.reduce((sum, task) => sum + task.progress, 0) / proaTasks.length)
      : 0;
    
    const iasProgress = iasTasks.length > 0
      ? Math.round(iasTasks.reduce((sum, task) => sum + task.progress, 0) / iasTasks.length)
      : 0;
    
    return { total: totalProgress, proa: proaProgress, ias: iasProgress };
  };

  // Handle checklist toggle
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

  const filteredTasks = getFilteredTasks();
  const globalProgress = calculateGlobalProgress();
  const institutionProgress = calculateInstitutionProgress(filteredTasks);

  // Get institution name
  const getInstitutionName = () => {
    if (selectedInstitution === 'todas') return 'Todas las instituciones';
    const number = selectedInstitution.replace('inst', '');
    return `Institución ${number}`;
  };

  return (
    <>
      <Header
        selectedInstitution={selectedInstitution}
        onInstitutionChange={setSelectedInstitution}
        selectedTrimester={selectedTrimester}
        onTrimesterChange={setSelectedTrimester}
        globalProgress={globalProgress}
      />

      <main className="flex-1 overflow-hidden">
        {selectedInstitution === 'todas' ? (
          <div className="h-full px-8 py-8">
            <KanbanBoard 
              tasks={filteredTasks} 
              onChecklistToggle={handleChecklistToggle}
            />
          </div>
        ) : (
          <InstitutionView
            institutionName={getInstitutionName()}
            tasks={filteredTasks}
            totalProgress={institutionProgress.total}
            proaProgress={institutionProgress.proa}
            iasProgress={institutionProgress.ias}
            onChecklistToggle={handleChecklistToggle}
          />
        )}
      </main>
    </>
  );
}
