import { type FC } from 'react';
import { 
  X, 
  User as UserIcon, 
  Settings as SettingsIcon,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import type { User } from './types';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onDeleteData: () => void;
  onResetOnboarding: () => void;
}

const SettingsDialog: FC<SettingsDialogProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  onDeleteData,
  onResetOnboarding
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
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

        <div className="p-6 space-y-8">
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

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 text-center">
          <p className="text-[10px] text-slate-400 font-medium">CheckMate v1.0.0 • Master your strategy</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;
