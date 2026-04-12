import { useState, type FC, type FormEvent, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Edit2, 
  Move, 
  ListTodo, 
  Hash, 
  X, 
  GripVertical, 
  Trash2,
  Calendar,
  Flag,
  MoreHorizontal,
  ExternalLink
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ConfirmationDialog from './ConfirmationDialog';
import type { Task, Project, Checklist } from './types';

interface TaskItemProps {
  task: Task;
  allTasks: Task[];
  projects?: Project[];
  checklists?: Checklist[];
  onToggle: (taskId: string) => void;
  onAddSubtask: (parentId: string, text: string) => void;
  onEdit: (taskId: string, newText: string) => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
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
  onUpdate,
  onDelete,
  onMove,
  hideGrip = false
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [selectedMoveProject, setSelectedMoveProject] = useState<Project | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const editInputRef = useRef<HTMLInputElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

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

  const extractLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  const renderTaskText = () => {
    const links = extractLinks(task.text);
    if (links.length === 0) return task.text;

    let displayDescription = task.text;
    links.forEach(link => {
      displayDescription = displayDescription.replace(link, '').trim();
    });

    return (
      <div className="flex flex-col">
        {displayDescription && (
          <span className={task.completed ? 'task-completed' : ''}>
            {displayDescription}
          </span>
        )}
        <div className="flex flex-wrap gap-1 mt-1">
          {links.map((link, index) => (
            <a
              key={index}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-action-indigo/10 text-action-indigo hover:bg-action-indigo hover:text-white rounded text-[10px] font-bold transition-all border border-action-indigo/20"
              title={link}
            >
              <ExternalLink className="w-2.5 h-2.5" />
              <span className="truncate max-w-[120px]">
                {link.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
              </span>
            </a>
          ))}
        </div>
      </div>
    );
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

  const toggleMoreMenu = () => {
    if (moreButtonRef.current) {
      const rect = moreButtonRef.current.getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + window.scrollY, left: rect.right - 180 + window.scrollX });
    }
    setShowMoreMenu(!showMoreMenu);
  };

  const handleMoveMenuToggle = () => {
    setShowMoreMenu(false);
    setShowMoveMenu(true);
  };

  const handleMoveSelect = (checklistId: string) => {
    if (onMove && selectedMoveProject) {
      onMove(task.id, selectedMoveProject.id, checklistId);
      setShowMoveMenu(false);
      setSelectedMoveProject(null);
    }
  };

  const handleDeleteClick = () => {
    setShowMoreMenu(false);
    if (subtasks.length > 0) {
      setShowDeleteConfirm(true);
    } else {
      onDelete(task.id);
    }
  };

  const cyclePriority = () => {
    const priorities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    const currentIdx = priorities.indexOf(task.priority || 'low');
    const nextPriority = priorities[(currentIdx + 1) % priorities.length];
    onUpdate(task.id, { priority: nextPriority });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : null;
    onUpdate(task.id, { dueDate: date });
    setShowMoreMenu(false);
  };

  const isRootTask = !task.parentId;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

  const priorityColors = {
    high: 'text-red-500 fill-red-500',
    medium: 'text-amber-500 fill-amber-500',
    low: 'text-emerald-500 fill-emerald-500'
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`relative ${task.parentId ? 'ml-8 border-l-2 border-slate-200 dark:border-slate-800 pl-4' : 'pl-8'} pr-4 py-1.5 min-w-0 ${isDragging ? 'z-50' : ''}`}
    >
      <div className="flex items-center group min-h-[32px] min-w-0">
        {/* Drag Handle */}
        {!hideGrip && (
          <div 
            {...attributes} 
            {...listeners} 
            className="absolute left-2 cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        <button 
          onClick={handleToggle}
          className="mr-3 focus:outline-none flex-shrink-0"
          aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
        >
          {task.completed ? (
            <CheckCircle2 className="w-5 h-5 text-victory-green" />
          ) : (
            <Circle className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-action-indigo dark:group-hover:text-action-indigo transition-colors" />
          )}
        </button>

        <div className="flex flex-col flex-grow min-w-0">
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="flex-grow min-w-0">
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
                className={`flex-grow cursor-pointer whitespace-normal break-words min-w-0 py-0.5 text-sm text-slate-700 dark:text-slate-200 transition-colors ${task.completed ? 'task-completed' : ''} ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}
              >
                {renderTaskText()}
              </span>
            )}

            {/* Status Indicators */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {task.priority && (
                <Flag className={`w-3 h-3 ${priorityColors[task.priority]}`} />
              )}
              {task.dueDate && (
                <div className={`flex items-center space-x-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <Calendar className="w-2.5 h-2.5" />
                  <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stable Action Bar - Fixed width to prevent jumping */}
        <div className="flex items-center space-x-1 ml-2 flex-shrink-0 min-w-[100px] justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => setIsEditing(true)}
            className="p-1 text-slate-400 dark:text-slate-500 hover:text-action-indigo dark:hover:text-action-indigo rounded transition-colors"
            title="Edit task"
            aria-label="Edit task"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowAddSubtask(!showAddSubtask)}
            className="p-1 text-slate-400 dark:text-slate-500 hover:text-action-indigo dark:hover:text-action-indigo rounded transition-colors"
            title="Add subtask"
            aria-label="Add subtask"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(task.id)}
            className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-500 rounded transition-colors"
            title="Delete task"
            aria-label="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          
          {/* More Menu Toggle */}
          <button 
            ref={moreButtonRef}
            onClick={toggleMoreMenu}
            className={`p-1 rounded transition-colors ${showMoreMenu ? 'bg-slate-100 dark:bg-slate-800 text-action-indigo' : 'text-slate-400 dark:text-slate-500 hover:text-action-indigo'}`}
            title="More actions"
            aria-label="More actions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          <div className="w-6 flex items-center justify-center">
            {subtasks.length > 0 && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 text-slate-400 dark:text-slate-500 hover:text-action-indigo dark:hover:text-action-indigo rounded transition-colors"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* More Menu Dropdown (Portaled) */}
        {showMoreMenu && createPortal(
          <div 
            className="fixed z-[300]"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-48 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden py-1"
            >
              <button 
                onClick={cyclePriority}
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Flag className={`w-4 h-4 ${task.priority ? priorityColors[task.priority] : 'text-slate-400'}`} />
                <span>Priority: <span className="capitalize">{task.priority || 'Low'}</span></span>
              </button>

              <div className="relative w-full flex items-center space-x-3 px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Set Due Date</span>
                <input 
                  type="date"
                  onChange={handleDateChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>

              {isRootTask && onMove && (
                <button 
                  onClick={handleMoveMenuToggle}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Move className="w-4 h-4 text-slate-400" />
                  <span>Move to Project</span>
                </button>
              )}
              
              <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
              
              <button 
                onClick={handleDeleteClick}
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Task</span>
              </button>
            </motion.div>
            <div className="fixed inset-0 -z-10" onClick={() => setShowMoreMenu(false)} />
          </div>,
          document.body
        )}

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
                  <button onClick={() => { setShowMoveMenu(false); setSelectedMoveProject(null); }} className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors" aria-label="Close menu">
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
                onUpdate={onUpdate}
                onDelete={onDelete}
                onMove={onMove}
                hideGrip={hideGrip}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationDialog 
        isOpen={showDeleteConfirm}
        title="Delete Task & Subtasks"
        message={`This task has ${subtasks.length} subtasks. Are you sure you want to delete the entire tree? This action cannot be undone.`}
        confirmLabel="Delete Everything"
        onConfirm={() => onDelete(task.id)}
        onCancel={() => setShowDeleteConfirm(false)}
        isDanger={true}
      />
    </div>
  );
};

export default TaskItem;
