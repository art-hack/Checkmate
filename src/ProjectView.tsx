import { useState, type FC, type FormEvent } from 'react';
import { Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import ProgressBar from './ProgressBar';
import TaskItem from './TaskItem';
import type { Project, Checklist, Task } from './types';

interface ProjectViewProps {
  project: Project;
  checklists: Checklist[];
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onAddSubtask: (parentId: string, text: string) => void;
  onAddChecklist: (name: string) => void;
}

const ProjectView: FC<ProjectViewProps> = ({ 
  project, 
  checklists, 
  tasks, 
  onToggleTask, 
  onAddSubtask,
  onAddChecklist
}) => {
  const [globalDone, setGlobalDone] = useState(false);
  const [newChecklistName, setNewChecklistName] = useState('');

  const calculateProgress = () => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(t => t.completed).length;
    return (completedTasks / tasks.length) * 100;
  };

  const handleAddChecklist = (e: FormEvent) => {
    e.preventDefault();
    if (newChecklistName.trim()) {
      onAddChecklist(newChecklistName.trim());
      setNewChecklistName('');
    }
  };

  const renderTasks = (checklistId: string, isDoneSection: boolean) => {
    return tasks
      .filter(t => t.checklistId === checklistId && !t.parentId && (isDoneSection ? t.completed : !t.completed))
      .sort((a, b) => a.order - b.order)
      .map(task => (
        <TaskItem 
          key={task.id} 
          task={task} 
          allTasks={tasks} 
          onToggle={onToggleTask}
          onAddSubtask={onAddSubtask}
        />
      ));
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{project.name}</h1>
        <ProgressBar progress={calculateProgress()} />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {globalDone ? 'Global Done' : 'Contextual Done'}
          </span>
          <button 
            onClick={() => setGlobalDone(!globalDone)}
            className="focus:outline-none"
          >
            {globalDone ? (
              <ToggleRight className="w-8 h-8 text-action-indigo" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-slate-400" />
            )}
          </button>
        </div>

        <form onSubmit={handleAddChecklist} className="flex items-center space-x-2">
          <input 
            type="text"
            value={newChecklistName}
            onChange={(e) => setNewChecklistName(e.target.value)}
            placeholder="New checklist..."
            className="border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1 bg-transparent text-sm"
          />
          <button type="submit" className="p-1 bg-action-indigo text-white rounded-md">
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="flex overflow-x-auto pb-6 space-x-6">
        {checklists.map(checklist => (
          <div key={checklist.id} className="min-w-[320px] bg-slate-50 dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-semibold mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
              {checklist.name}
            </h2>
            
            <div className="space-y-1">
              {renderTasks(checklist.id, false)}
            </div>

            {!globalDone && (
              <div className="mt-8">
                <h3 className="text-sm font-bold text-victory-green uppercase tracking-wider mb-2">Done</h3>
                <div className="space-y-1">
                  {renderTasks(checklist.id, true)}
                </div>
              </div>
            )}
          </div>
        ))}

        {globalDone && (
          <div className="min-w-[320px] bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-4 shadow-sm border border-emerald-100 dark:border-emerald-900/50">
            <h2 className="text-lg font-semibold mb-4 border-b border-emerald-200 dark:border-emerald-900 pb-2 text-victory-green">
              Global Done
            </h2>
            <div className="space-y-1">
              {tasks.filter(t => t.completed && !t.parentId).map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  allTasks={tasks} 
                  onToggle={onToggleTask}
                  onAddSubtask={onAddSubtask}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectView;
