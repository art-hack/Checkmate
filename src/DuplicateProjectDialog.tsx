import { useState, type FC, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, X, CheckSquare } from 'lucide-react';

interface DuplicateProjectDialogProps {
  isOpen: boolean;
  projectName: string;
  onConfirm: (newName: string, copyTasks: boolean) => void;
  onCancel: () => void;
}

const DuplicateProjectDialog: FC<DuplicateProjectDialogProps> = ({
  isOpen,
  projectName,
  onConfirm,
  onCancel,
}) => {
  const [newName, setNewName] = useState(`${projectName} (Copy)`);
  const [copyTasks, setCopyTasks] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setNewName(`${projectName} (Copy)`);
    }
  }, [isOpen, projectName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onConfirm(newName.trim(), copyTasks);
      onCancel();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md glass-card overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-full bg-action-indigo/10 text-action-indigo">
                <Copy className="w-6 h-6" />
              </div>
              <button 
                onClick={onCancel}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Duplicate Project
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Create a new project based on "{projectName}".
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                  New Project Name
                </label>
                <input 
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter project name..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-action-indigo focus:ring-4 focus:ring-action-indigo/10 transition-all"
                />
              </div>

              <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 cursor-pointer group"
                   onClick={() => setCopyTasks(!copyTasks)}>
                <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${copyTasks ? 'bg-action-indigo text-white' : 'border-2 border-slate-300 dark:border-slate-600'}`}>
                  {copyTasks && <CheckSquare className="w-4 h-4" />}
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Include Tasks</span>
                  <p className="text-xs text-slate-400">Copy all checklist items and subtasks</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-action-indigo hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                  Create Duplicate
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DuplicateProjectDialog;
