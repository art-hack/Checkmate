import { useState, type FC, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import type { Task } from './types';

interface TaskItemProps {
  task: Task;
  allTasks: Task[];
  onToggle: (taskId: string) => void;
  onAddSubtask: (parentId: string, text: string) => void;
}

const TaskItem: FC<TaskItemProps> = ({ task, allTasks, onToggle, onAddSubtask }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  const subtasks = allTasks.filter(t => t.parentId === task.id).sort((a, b) => a.order - b.order);

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

  return (
    <div className="ml-4 border-l-2 border-slate-200 pl-4 py-2">
      <div className="flex items-center group">
        <button 
          onClick={handleToggle}
          className="mr-2 focus:outline-none"
        >
          {task.completed ? (
            <CheckCircle2 className="w-5 h-5 text-victory-green" />
          ) : (
            <Circle className="w-5 h-5 text-slate-400 group-hover:text-action-indigo" />
          )}
        </button>

        <span className={`flex-grow cursor-pointer ${task.completed ? 'task-completed' : ''}`}>
          {task.text}
        </span>

        <div className="hidden group-hover:flex items-center space-x-1">
          <button 
            onClick={() => setShowAddSubtask(!showAddSubtask)}
            className="p-1 text-slate-400 hover:text-action-indigo rounded"
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
                onToggle={onToggle}
                onAddSubtask={onAddSubtask}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskItem;
