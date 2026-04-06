import { useState, type FC, type FormEvent, useRef, useEffect } from 'react';
import { Plus, Edit2, CheckCircle2 } from 'lucide-react';
import ProgressBar from './ProgressBar';
import TaskItem from './TaskItem';
import type { Project, Checklist, Task } from './types';

interface ProjectViewProps {
  project: Project;
  checklists: Checklist[];
  tasks: Task[];
  allProjects: Project[];
  allChecklists: Checklist[];
  onToggleTask: (taskId: string) => void;
  onAddSubtask: (parentId: string, text: string) => void;
  onEditTask: (taskId: string, newText: string) => void;
  onMoveTask: (taskId: string, newProjectId: string, newChecklistId: string) => void;
  onAddChecklist: (name: string) => void;
  onEditChecklist: (checklistId: string, newName: string) => void;
}

const ProjectView: FC<ProjectViewProps> = ({ 
  project, 
  checklists, 
  tasks,
  allProjects,
  allChecklists,
  onToggleTask, 
  onAddSubtask,
  onEditTask,
  onMoveTask,
  onAddChecklist,
  onEditChecklist
}) => {
  const [globalDone, setGlobalDone] = useState(false);
  const [newChecklistName, setNewChecklistName] = useState('');
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editChecklistName, setEditChecklistName] = useState('');
  const editChecklistInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingChecklistId) {
      editChecklistInputRef.current?.focus();
    }
  }, [editingChecklistId]);

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

  const handleEditChecklistSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (editingChecklistId && editChecklistName.trim()) {
      onEditChecklist(editingChecklistId, editChecklistName.trim());
    }
    setEditingChecklistId(null);
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
          projects={allProjects}
          checklists={allChecklists}
          onToggle={onToggleTask}
          onAddSubtask={onAddSubtask}
          onEdit={onEditTask}
          onMove={onMoveTask}
        />
      ));
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex-shrink-0">
        <h1 className="text-3xl font-bold mb-4">{project.name}</h1>
        <ProgressBar progress={calculateProgress()} />
      </div>

      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setGlobalDone(!globalDone)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center space-x-2 ${globalDone ? 'bg-victory-green text-white shadow-lg shadow-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{globalDone ? 'Hide Done' : 'Show Done'}</span>
          </button>
        </div>

        <form onSubmit={handleAddChecklist} className="flex items-center space-x-2">
          <input 
            type="text"
            value={newChecklistName}
            onChange={(e) => setNewChecklistName(e.target.value)}
            placeholder="New checklist..."
            className="border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1 bg-transparent text-sm outline-none focus:border-action-indigo"
          />
          <button type="submit" className="p-1 bg-action-indigo text-white rounded-md hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="flex-grow flex flex-col min-h-0 space-y-8 overflow-y-auto pr-2">
        {/* Active Section */}
        <section>
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-action-indigo animate-pulse" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Checklists</h3>
          </div>
          <div className="flex space-x-6 pb-4 overflow-x-auto min-h-[300px]">
            {checklists.map(checklist => (
              <div key={checklist.id} className="min-w-[320px] max-w-[400px] flex-shrink-0 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3 group flex-shrink-0">
                  {editingChecklistId === checklist.id ? (
                    <form onSubmit={handleEditChecklistSubmit} className="flex-grow">
                      <input
                        ref={editChecklistInputRef}
                        type="text"
                        value={editChecklistName}
                        onChange={(e) => setEditChecklistName(e.target.value)}
                        onBlur={() => handleEditChecklistSubmit()}
                        className="w-full bg-transparent outline-none font-bold text-lg text-slate-800 dark:text-slate-100"
                      />
                    </form>
                  ) : (
                    <>
                      <h2 className="text-lg font-bold truncate cursor-pointer text-slate-800 dark:text-slate-100" onDoubleClick={() => {
                        setEditingChecklistId(checklist.id);
                        setEditChecklistName(checklist.name);
                      }}>
                        {checklist.name}
                      </h2>
                      <button 
                        onClick={() => {
                          setEditingChecklistId(checklist.id);
                          setEditChecklistName(checklist.name);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-action-indigo transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
                
                <div className="space-y-1 overflow-y-auto flex-grow min-h-0 custom-scrollbar">
                  {renderTasks(checklist.id, false)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Done Section (Horizontal Separation) */}
        {globalDone && (
          <section className="pt-8 border-t-2 border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center space-x-2 mb-6">
              <CheckCircle2 className="w-5 h-5 text-victory-green" />
              <h3 className="text-lg font-bold text-victory-green">Mission Accomplished</h3>
              <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-victory-green px-2 py-0.5 rounded-full font-bold">
                {tasks.filter(t => t.completed && !t.parentId).length} items
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {checklists.map(checklist => {
                const completedTasks = tasks.filter(t => t.checklistId === checklist.id && t.completed && !t.parentId);
                if (completedTasks.length === 0) return null;

                return (
                  <div key={`done-${checklist.id}`} className="bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-4 border border-dashed border-slate-200 dark:border-slate-800">   
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 px-2 flex items-center justify-between">
                      <span>From: {checklist.name}</span>
                    </h4>
                    <div className="space-y-1 opacity-75 grayscale-[0.5] hover:grayscale-0 transition-all">
                      {completedTasks.map(task => (
                        <TaskItem 
                          key={task.id} 
                          task={task} 
                          allTasks={tasks} 
                          projects={allProjects}
                          checklists={allChecklists}
                          onToggle={onToggleTask}
                          onAddSubtask={onAddSubtask}
                          onEdit={onEditTask}
                          onMove={onMoveTask}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Orphaned Tasks (Safety fallback) */}
              {(() => {
                const checklistIds = new Set(checklists.map(c => c.id));
                const orphanedTasks = tasks.filter(t => t.completed && !t.parentId && !checklistIds.has(t.checklistId));
                if (orphanedTasks.length === 0) return null;

                return (
                  <div key="done-orphaned" className="bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-4 border border-dashed border-slate-200 dark:border-slate-800">   
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 px-2 flex items-center justify-between">
                      <span>From: Uncategorized</span>
                    </h4>
                    <div className="space-y-1 opacity-75 grayscale-[0.5] hover:grayscale-0 transition-all">
                      {orphanedTasks.map(task => (
                        <TaskItem 
                          key={task.id} 
                          task={task} 
                          allTasks={tasks} 
                          projects={allProjects}
                          checklists={allChecklists}
                          onToggle={onToggleTask}
                          onAddSubtask={onAddSubtask}
                          onEdit={onEditTask}
                          onMove={onMoveTask}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

          </section>
        )}
      </div>
    </div>
  );
};

export default ProjectView;
