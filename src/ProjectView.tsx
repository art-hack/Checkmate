import { useState, type FC, type FormEvent, useRef, useEffect } from 'react';
import { Plus, Edit2, CheckCircle2, Trash2, Eraser } from 'lucide-react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import ProgressBar from './ProgressBar';
import TaskItem from './TaskItem';
import ConfirmationDialog from './ConfirmationDialog';
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
  onDeleteTask: (taskId: string) => void;
  onMoveTask: (taskId: string, newProjectId: string, newChecklistId: string) => void;
  onAddChecklist: (name: string) => void;
  onEditChecklist: (checklistId: string, newName: string) => void;
  onDeleteChecklist: (checklistId: string) => void;
  onAddTask: (text: string, projectId: string, checklistId: string) => void;
  onReorderTasks: (projectId: string, checklistId: string, parentId: string | null, newTasks: Task[]) => void;
  onClearDoneTasks: (projectId: string) => void;
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
  onDeleteTask,
  onMoveTask,
  onAddChecklist,
  onEditChecklist,
  onDeleteChecklist,
  onAddTask,
  onReorderTasks,
  onClearDoneTasks
}) => {
  const [globalDone, setGlobalDone] = useState(false);
  const [newChecklistName, setNewChecklistName] = useState('');
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editChecklistName, setEditChecklistName] = useState('');
  const [inlineTaskText, setInlineTaskText] = useState<{ [key: string]: string }>({});
  
  const [checklistToDelete, setChecklistToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showClearDoneConfirm, setShowClearDoneConfirm] = useState(false);

  const editChecklistInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleAddInlineTask = (e: FormEvent, checklistId: string) => {
    e.preventDefault();
    const text = inlineTaskText[checklistId];
    if (text?.trim()) {
      onAddTask(text.trim(), project.id, checklistId);
      setInlineTaskText({ ...inlineTaskText, [checklistId]: '' });
    }
  };

  const handleDragEnd = (event: DragEndEvent, checklistId: string, parentId: string | null) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const filteredTasks = tasks.filter(t => t.checklistId === checklistId && t.parentId === parentId && !t.completed);
      const oldIndex = filteredTasks.findIndex(t => t.id === active.id);
      const newIndex = filteredTasks.findIndex(t => t.id === over.id);
      
      const newTasks = arrayMove(filteredTasks, oldIndex, newIndex);
      onReorderTasks(project.id, checklistId, parentId, newTasks);
    }
  };

  const renderTasks = (checklistId: string, isDoneSection: boolean) => {
    const filteredTasks = tasks
      .filter(t => t.checklistId === checklistId && !t.parentId && (isDoneSection ? t.completed : !t.completed))
      .sort((a, b) => a.order - b.order);

    if (isDoneSection) {
      return filteredTasks.map(task => (
        <TaskItem 
          key={task.id} 
          task={task} 
          allTasks={tasks} 
          projects={allProjects}
          checklists={allChecklists}
          onToggle={onToggleTask}
          onAddSubtask={onAddSubtask}
          onEdit={onEditTask}
          onDelete={onDeleteTask}
          onMove={onMoveTask}
        />
      ));
    }

    return (
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(e) => handleDragEnd(e, checklistId, null)}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext 
          items={filteredTasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {filteredTasks.map(task => (
            <TaskItem 
              key={task.id} 
              task={task} 
              allTasks={tasks} 
              projects={allProjects}
              checklists={allChecklists}
              onToggle={onToggleTask}
              onAddSubtask={onAddSubtask}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onMove={onMoveTask}
            />
          ))}
        </SortableContext>
      </DndContext>
    );
  };

  const completedTasksCount = tasks.filter(t => t.completed && !t.parentId).length;

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex-shrink-0">
        <h1 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">{project.name}</h1>
        <ProgressBar progress={calculateProgress()} />
      </div>

      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setGlobalDone(!globalDone)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center space-x-2 ${globalDone ? 'bg-victory-green text-white shadow-lg shadow-emerald-200' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
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
            className="border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1 bg-white dark:bg-slate-900 text-sm outline-none focus:border-action-indigo transition-colors"
          />
          <button type="submit" className="p-1 bg-action-indigo text-white rounded-md hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="flex-grow flex flex-col min-h-0 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
        {/* Active Section */}
        <section>
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-action-indigo animate-pulse" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Checklists</h3>
          </div>
          <div className="flex space-x-6 pb-4 overflow-x-auto min-h-[400px] custom-scrollbar">
            {checklists.map(checklist => (
              <div key={checklist.id} className="min-w-[320px] max-w-[400px] flex-shrink-0 glass-card rounded-2xl p-5 flex flex-col h-full transition-colors">
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
                      <h2 className="text-lg font-bold truncate cursor-pointer text-slate-800 dark:text-slate-100 flex-grow" onDoubleClick={() => {
                        setEditingChecklistId(checklist.id);
                        setEditChecklistName(checklist.name);
                      }}>
                        {checklist.name}
                      </h2>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => {
                            setEditingChecklistId(checklist.id);
                            setEditChecklistName(checklist.name);
                          }}
                          className="text-slate-400 hover:text-action-indigo p-1"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setChecklistToDelete({ id: checklist.id, name: checklist.name })}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <form onSubmit={(e) => handleAddInlineTask(e, checklist.id)} className="mb-4 flex-shrink-0">
                  <div className="flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-100 dark:border-slate-700 focus-within:border-action-indigo transition-colors">
                    <Plus className="w-4 h-4 text-slate-400 mr-2" />
                    <input 
                      type="text"
                      value={inlineTaskText[checklist.id] || ''}
                      onChange={(e) => setInlineTaskText({ ...inlineTaskText, [checklist.id]: e.target.value })}
                      placeholder="Add task..."
                      className="bg-transparent outline-none text-sm w-full text-slate-700 dark:text-slate-200"
                    />
                  </div>
                </form>
                
                <div className="space-y-1 overflow-y-auto flex-grow min-h-0 custom-scrollbar pr-1">
                  {renderTasks(checklist.id, false)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Done Section (Horizontal Separation) */}
        {globalDone && (
          <section className="pt-8 border-t-2 border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-victory-green" />
                <h3 className="text-lg font-bold text-victory-green">Mission Accomplished</h3>
                <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-victory-green px-2 py-0.5 rounded-full font-bold">
                  {completedTasksCount} items
                </span>
              </div>
              
              {completedTasksCount > 0 && (
                <button 
                  onClick={() => setShowClearDoneConfirm(true)}
                  className="flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Clear All Done</span>
                </button>
              )}
            </div>
            
            <div className="flex space-x-6 pb-8 overflow-x-auto custom-scrollbar">
              {checklists.map(checklist => {
                const completedTasks = tasks.filter(t => t.checklistId === checklist.id && t.completed && !t.parentId);
                if (completedTasks.length === 0) return null;

                return (
                  <div key={`done-${checklist.id}`} className="min-w-[320px] max-w-[400px] flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-4 border border-dashed border-slate-200 dark:border-slate-800 h-fit transition-colors">   
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
                          onDelete={onDeleteTask}
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
                  <div key="done-orphaned" className="min-w-[320px] max-w-[400px] flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-4 border border-dashed border-slate-200 dark:border-slate-800 h-fit transition-colors">   
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
                          onDelete={onDeleteTask}
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

      {/* Confirmation Dialogs */}
      <ConfirmationDialog 
        isOpen={!!checklistToDelete}
        title="Delete Checklist"
        message={`Are you sure you want to delete "${checklistToDelete?.name}"? All tasks within this column will be permanently removed.`}
        confirmLabel="Delete Checklist"
        onConfirm={() => checklistToDelete && onDeleteChecklist(checklistToDelete.id)}
        onCancel={() => setChecklistToDelete(null)}
        isDanger={true}
      />

      <ConfirmationDialog 
        isOpen={showClearDoneConfirm}
        title="Clear Completed Tasks"
        message="Are you sure you want to permanently remove all completed tasks from this project? This action cannot be undone."
        confirmLabel="Clear All Done"
        onConfirm={() => onClearDoneTasks(project.id)}
        onCancel={() => setShowClearDoneConfirm(false)}
        isDanger={true}
      />
    </div>
  );
};

export default ProjectView;
