import { useState, type FC, type FormEvent, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, ChevronDown, ChevronRight, Plus, Edit2, Move, ListTodo, Hash, X, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  hideGrip?: boolean;
}

const TaskItem: FC<TaskItemProps> = ({ 
  task, 
  allTasks, 
  projects, 
  checklists, 
  onToggle, 
  onAddSubtask, 
  onEdit,
  onMove,
  hideGrip = false
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [selectedMoveProject, setSelectedMoveProject] = useState<Project | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  
  const editInputRef = useRef<HTMLInputElement>(null);
  const moveButtonRef = useRef<HTMLButtonElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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

  const handleMoveClick = () => {
    if (moveButtonRef.current) {
      const rect = moveButtonRef.current.getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + window.scrollY, left: rect.right - 256 + window.scrollX });
    }
    setShowMoveMenu(!showMoveMenu);
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
    <div 
      ref={setNodeRef}
      style={style}
      className={`relative ${task.parentId ? 'ml-6 border-l-2 border-slate-200 dark:border-slate-800 pl-4' : 'pl-6'} pr-4 py-1.5 ${isDragging ? 'z-50' : ''}`}
    >
      <div className="flex items-center group min-h-[32px]">
        {/* Drag Handle - Absolutely positioned to the left of the item content */}
        {!hideGrip && (
          <div 
            {...attributes} 
            {...listeners} 
            className="absolute left-0 cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        <button 
          onClick={handleToggle}
          className="mr-3 focus:outline-none flex-shrink-0"
        >
          {task.completed ? (
            <CheckCircle2 className="w-5 h-5 text-victory-green" />
          ) : (
            <Circle className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-action-indigo dark:group-hover:text-action-indigo transition-colors" />
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
              className="w-full bg-transparent border-b border-action-indigo outline-none px-1 py-0.5 text-sm text-slate-900 dark:text-slate-100"
            />
          </form>
        ) : (
          <span 
            onDoubleClick={() => setIsEditing(true)}
            className={`flex-grow cursor-pointer whitespace-normal break-words min-w-0 py-0.5 text-sm text-slate-700 dark:text-slate-200 transition-colors ${task.completed ? 'task-completed' : ''}`}
          >
            {task.text}
          </span>
        )}

        <div className="hidden group-hover:flex items-center space-x-1 ml-2">
          {isRootTask && onMove && projects && checklists && (
            <button 
              ref={moveButtonRef}
              onClick={handleMoveClick}
              className="p-1 text-slate-400 dark:text-slate-500 hover:text-action-indigo dark:hover:text-action-indigo rounded transition-colors"
              title="Move to project"
            >
              <Move className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => setIsEditing(true)}
            className="p-1 text-slate-400 dark:text-slate-500 hover:text-action-indigo dark:hover:text-action-indigo rounded transition-colors"
            title="Edit task"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowAddSubtask(!showAddSubtask)}
            className="p-1 text-slate-400 dark:text-slate-500 hover:text-action-indigo dark:hover:text-action-indigo rounded transition-colors"
            title="Add subtask"
          >
            <Plus className="w-4 h-4" />
          </button>
          {subtasks.length > 0 && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-slate-400 dark:text-slate-500 hover:text-action-indigo dark:hover:text-action-indigo rounded transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Move Menu Dropdown (Portaled) */}
        {showMoveMenu && projects && checklists && createPortal(
          <div 
            className="fixed z-[300]"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <AnimatePresence>
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 5 }}
                className="w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                <div className="p-2 bg-slate-50 dark:bg-slate-700/50 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">
                    {selectedMoveProject ? 'Select Section' : 'Move Task'}
                  </span>
                  <button onClick={() => { setShowMoveMenu(false); setSelectedMoveProject(null); }} className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  {!selectedMoveProject ? (
                    projects.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => setSelectedMoveProject(p)}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-b last:border-0 border-slate-100 dark:border-slate-800"
                      >
                        <Hash className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{p.name}</span>
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
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{c.name}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>,
          document.body
        )}
      </div>

      <AnimatePresence>
        {showAddSubtask && (
          <motion.form 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleAddSubtask}
            className="mt-2 flex items-center ml-8"
          >
            <input 
              autoFocus
              type="text"
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              placeholder="New subtask..."
              className="flex-grow border-b border-action-indigo bg-transparent outline-none px-2 py-1 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
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
                hideGrip={hideGrip}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskItem;
