import { useState, type FC, type FormEvent, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, ChevronDown, ChevronRight, Plus, Edit2, Move, ListTodo, Hash, X } from 'lucide-react';
import type { Task, Project, Checklist } from './types';

interface TaskItemProps {
  task: Task;
  allTasks: Task[];
  projects?: Project[];
  checklists?: Checklist[];
  onToggle: (taskId: string) => void;
  onAddSubtask: (parentId: string, text: string) => void;
  onEdit: (taskId: string, newText: string) => void;
  onMove?: (taskId: string, newProjectId: string, newChecklistId: string) => void;
}

const TaskItem: FC<TaskItemProps> = ({ 
  task, 
  allTasks, 
  projects, 
  checklists, 
  onToggle, 
  onAddSubtask, 
  onEdit,
  onMove 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [selectedMoveProject, setSelectedMoveProject] = useState<Project | null>(null);
  
  const editInputRef = useRef<HTMLInputElement>(null);

  const subtasks = allTasks.filter(t => t.parentId === task.id).sort((a, b) => a.order - b.order);

  useEffect(() => {
    if (isEditing) {
      editInputRef.current?.focus();
    }
  }, [isEditing]);

  const handleToggle = () => {
    onToggle(task.id);
  };

  const handleAddSubtask = (e: FormEvent) => {
    e.preventDefault();
    if (newSubtaskText.trim()) {
      onAddSubtask(task.id, newSubtaskText.trim());
      setNewSubtaskText('');
      setShowAddSubtask(false);
      setIsExpanded(true);
    }
  };

  const handleEditSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (editText.trim() && editText !== task.text) {
      onEdit(task.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleMoveSelect = (checklistId: string) => {
    if (onMove && selectedMoveProject) {
      onMove(task.id, selectedMoveProject.id, checklistId);
      setShowMoveMenu(false);
      setSelectedMoveProject(null);
    }
  };

  const isRootTask = !task.parentId;

  return (
    <div className="ml-4 border-l-2 border-slate-200 pl-4 pr-4 py-2">
      <div className="flex items-center group relative">
        <button 
          onClick={handleToggle}
          className="mr-2 focus:outline-none flex-shrink-0"
        >
          {task.completed ? (
            <CheckCircle2 className="w-5 h-5 text-victory-green" />
          ) : (
            <Circle className="w-5 h-5 text-slate-400 group-hover:text-action-indigo" />
          )}
        </button>

        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="flex-grow mr-2 min-w-0">
            <input
              ref={editInputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={() => handleEditSubmit()}
              className="w-full bg-transparent border-b border-action-indigo outline-none px-1"
            />
          </form>
        ) : (
          <span 
            onDoubleClick={() => setIsEditing(true)}
            className={`flex-grow cursor-pointer whitespace-normal break-words min-w-0 ${task.completed ? 'task-completed' : ''}`}
          >
            {task.text}
          </span>
        )}

        <div className="hidden group-hover:flex items-center space-x-1">
          {isRootTask && onMove && projects && checklists && (
            <button 
              onClick={() => setShowMoveMenu(!showMoveMenu)}
              className="p-1 text-slate-400 hover:text-action-indigo rounded"
              title="Move to project"
            >
              <Move className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => setIsEditing(true)}
            className="p-1 text-slate-400 hover:text-action-indigo rounded"
            title="Edit task"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowAddSubtask(!showAddSubtask)}
            className="p-1 text-slate-400 hover:text-action-indigo rounded"
            title="Add subtask"
          >
            <Plus className="w-4 h-4" />
          </button>
          {subtasks.length > 0 && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-slate-400 hover:text-action-indigo rounded"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Move Menu Dropdown */}
        <AnimatePresence>
          {showMoveMenu && projects && checklists && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-[100] overflow-hidden"
            >
              <div className="p-2 bg-slate-50 dark:bg-slate-700/50 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
                  {selectedMoveProject ? 'Select Section' : 'Move Task'}
                </span>
                <button onClick={() => { setShowMoveMenu(false); setSelectedMoveProject(null); }} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto">
                {!selectedMoveProject ? (
                  projects.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => setSelectedMoveProject(p)}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-b last:border-0 border-slate-100 dark:border-slate-800"
                    >
                      <Hash className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium">{p.name}</span>
                    </button>
                  ))
                ) : (
                  <>
                    <button 
                      onClick={() => setSelectedMoveProject(null)}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-left bg-slate-50 dark:bg-slate-900/50 text-action-indigo font-bold border-b border-slate-100 dark:border-slate-800"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      <span className="text-xs">Back to Projects</span>
                    </button>
                    {checklists.filter(c => c.projectId === selectedMoveProject.id).map(c => (
                      <button 
                        key={c.id}
                        onClick={() => handleMoveSelect(c.id)}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-b last:border-0 border-slate-100 dark:border-slate-800"
                      >
                        <ListTodo className="w-4 h-4 text-action-indigo" />
                        <span className="text-sm font-medium">{c.name}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showAddSubtask && (
          <motion.form 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleAddSubtask}
            className="mt-2 flex items-center"
          >
            <input 
              autoFocus
              type="text"
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              placeholder="New subtask..."
              className="flex-grow border-b border-action-indigo bg-transparent outline-none px-2 py-1 text-sm"
            />
          </motion.form>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpanded && subtasks.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {subtasks.map(subtask => (
              <TaskItem 
                key={subtask.id} 
                task={subtask} 
                allTasks={allTasks} 
                projects={projects}
                checklists={checklists}
                onToggle={onToggle}
                onAddSubtask={onAddSubtask}
                onEdit={onEdit}
                onMove={onMove}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskItem;
