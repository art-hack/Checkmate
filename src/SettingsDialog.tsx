import { useState, useEffect, type FC } from 'react';
import { 
  X, 
  User as UserIcon, 
  Settings as SettingsIcon,
  HelpCircle,
  AlertTriangle,
  Download,
  Upload,
  FileText,
  Clock,
  ShieldCheck
} from 'lucide-react';
import type { User, Project, Task, Checklist } from './types';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  projects: Project[];
  checklists: Checklist[];
  tasks: Task[];
  onDeleteData: () => void;
  onResetOnboarding: () => void;
  onImportRawText: (text: string, projectName: string) => Promise<string | undefined>;
}

const SettingsDialog: FC<SettingsDialogProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  projects,
  checklists,
  tasks,
  onDeleteData,
  onResetOnboarding,
  onImportRawText
}) => {
  const [importText, setImportText] = useState('');
  const [importProjectName, setImportProjectName] = useState('Bulk Import');
  const [isImporting, setIsImporting] = useState(false);

  // Auto-clear settings
  const [autoClearEnabled, setAutoClearEnabled] = useState(() => {
    return localStorage.getItem(`autoclear_enabled_${user.uid}`) === 'true';
  });
  const [autoClearHours, setAutoClearHours] = useState(() => {
    return parseInt(localStorage.getItem(`autoclear_hours_${user.uid}`) || '24');
  });

  useEffect(() => {
    localStorage.setItem(`autoclear_enabled_${user.uid}`, autoClearEnabled.toString());
    localStorage.setItem(`autoclear_hours_${user.uid}`, autoClearHours.toString());
  }, [autoClearEnabled, autoClearHours, user.uid]);

  if (!isOpen) return null;

  const handleExport = () => {
    // 1. Recursive helper to get tasks without IDs
    const getTasksTree = (parentId: string | null, checklistId: string): any[] => {
      return tasks
        .filter(t => t.checklistId === checklistId && t.parentId === parentId)
        .sort((a, b) => a.order - b.order)
        .map(t => ({
          text: t.text,
          completed: t.completed,
          priority: t.priority || 'low',
          dueDate: t.dueDate || null,
          completedAt: t.completedAt || null,
          subtasks: getTasksTree(t.id, checklistId)
        }));
    };

    // 2. Build hierarchical data structure
    const exportedProjects = projects.map(p => ({
      name: p.name,
      isInbox: !!p.isInbox,
      checklists: checklists
        .filter(c => c.projectId === p.id)
        .sort((a, b) => a.order - b.order)
        .map(c => ({
          name: c.name,
          tasks: getTasksTree(null, c.id)
        }))
    }));

    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      projects: exportedProjects
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `checkmate-clean-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    setIsImporting(true);
    try {
      await onImportRawText(importText, importProjectName);
      setImportText('');
      setImportProjectName('Bulk Import');
      alert('Import successful!');
    } catch (err) {
      console.error(err);
      alert('Import failed.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 flex-shrink-0">
          <div className="flex items-center space-x-2 font-bold text-slate-800 dark:text-white">
            <SettingsIcon className="w-5 h-5 text-action-indigo" />
            <span>Settings</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
          {/* Profile Section */}
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Account</h3>
            <div className="flex items-center space-x-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-700 shadow-sm" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-action-indigo flex items-center justify-center text-white">
                  <UserIcon className="w-6 h-6" />
                </div>
              )}
              <div className="flex-grow min-w-0">
                <p className="font-bold text-slate-900 dark:text-white truncate">{user.displayName}</p>
                <p className="text-sm text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          </section>

          {/* Workflow Section */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Workflow</h3>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-victory-green" />
                  <span className="text-sm font-bold">Auto-clear Done Tasks</span>
                </div>
                <button 
                  onClick={() => setAutoClearEnabled(!autoClearEnabled)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${autoClearEnabled ? 'bg-victory-green' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoClearEnabled ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
              
              {autoClearEnabled && (
                <div className="flex items-center space-x-3 mt-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-500">Remove after</span>
                  <input 
                    type="number" 
                    value={autoClearHours}
                    onChange={(e) => setAutoClearHours(parseInt(e.target.value) || 1)}
                    className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs outline-none focus:border-action-indigo"
                  />
                  <span className="text-xs text-slate-500">hours</span>
                </div>
              )}
              <p className="text-[10px] text-slate-400 mt-3 italic">Clean up your workspace by automatically archiving tasks after they're completed.</p>
            </div>
          </section>

          {/* Data Portability */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Data Portability</h3>
            
            {/* Export */}
            <div className="p-4 bg-indigo-50/50 dark:bg-action-indigo/5 rounded-xl border border-indigo-100 dark:border-action-indigo/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-indigo-700 dark:text-indigo-400">
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-bold">Export My Data</span>
                </div>
                <button 
                  onClick={handleExport}
                  className="px-4 py-1.5 bg-action-indigo text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
                >
                  Download JSON
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Download all your projects, checklists, and tasks in a single JSON file.</p>
            </div>

            {/* Import */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 space-y-4">
              <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                <Upload className="w-4 h-4" />
                <span className="text-sm font-bold">Bulk Import</span>
              </div>
              
              <div className="space-y-2">
                <input 
                  type="text" 
                  value={importProjectName}
                  onChange={(e) => setImportProjectName(e.target.value)}
                  placeholder="New Project Name..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs outline-none focus:border-action-indigo"
                />
                <textarea 
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste tasks here (one per line)..."
                  className="w-full h-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs outline-none focus:border-action-indigo resize-none"
                />
              </div>

              <button 
                onClick={handleImport}
                disabled={isImporting || !importText.trim()}
                className="w-full flex items-center justify-center space-x-2 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{isImporting ? 'Importing...' : 'Import Task List'}</span>
              </button>
            </div>
          </section>

          {/* Preferences Section */}
          <section>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Preferences</h3>
            <button 
              onClick={() => {
                onResetOnboarding();
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
            >
              <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-300">
                <HelpCircle className="w-5 h-5 text-action-indigo" />
                <span className="text-sm font-medium">Replay Welcome Tour</span>
              </div>
              <div className="text-[10px] font-bold text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">RESET</div>
            </button>
          </section>

          {/* Danger Zone */}
          <section>
            <h3 className="text-xs font-bold text-red-500/70 uppercase tracking-widest mb-4">Danger Zone</h3>
            <div className="p-4 border border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/10 rounded-xl space-y-4">
              <div className="flex items-start space-x-3 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold">Wipe All Data</p>
                  <p className="text-xs opacity-80">This will permanently delete all your projects, checklists, and tasks. This action cannot be undone.</p>
                </div>
              </div>
              <button 
                onClick={onDeleteData}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-all shadow-lg shadow-red-200 dark:shadow-none"
              >
                Permanently Delete Everything
              </button>
            </div>
          </section>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 text-center flex-shrink-0">
          <p className="text-[10px] text-slate-400 font-medium">CheckMate v1.0.0 • Master your strategy</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;
