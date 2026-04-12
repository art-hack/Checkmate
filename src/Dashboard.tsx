import { useState, useEffect, type FC, type ReactNode, type FormEvent } from 'react';
import { LayoutDashboard, CheckSquare, ListTodo, LogOut, Plus, Trash2, Crown, Inbox as InboxIcon, ChevronLeft, ChevronRight, Copy, Moon, Sun, Monitor, Download, Settings } from 'lucide-react';
import SmartQuickAdd from './SmartQuickAdd';
import TaskItem from './TaskItem';
import ConfirmationDialog from './ConfirmationDialog';
import DuplicateProjectDialog from './DuplicateProjectDialog';
import SettingsDialog from './SettingsDialog';
import type { Project, Task, User, Checklist } from './types';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface DashboardProps {
  user: User;
  projects: Project[];
  checklists: Checklist[];
  tasks: Task[];
  activeProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onAddTask: (text: string, projectId: string, checklistId: string) => void;
  onToggleTask: (taskId: string) => void;
  onEditTask: (taskId: string, newText: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTask: (taskId: string, newProjectId: string, newChecklistId: string) => void;
  onAddProject: (name: string) => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (projectId: string, newName: string, copyTasks: boolean) => void;
  onDeleteAccountData: () => void;
  onResetOnboarding: () => void;
  onLogout: () => void;
  theme: 'light' | 'dark' | 'system';
  onThemeToggle: (theme: 'light' | 'dark' | 'system') => void;
  children?: ReactNode;
}

const Dashboard: FC<DashboardProps> = ({
  user,
  projects,
  checklists,
  tasks,
  activeProjectId,
  onSelectProject,
  onAddTask,
  onToggleTask,
  onEditTask,
  onUpdateTask,
  onDeleteTask,
  onMoveTask,
  onAddProject,
  onDeleteProject,
  onDuplicateProject,
  onDeleteAccountData,
  onResetOnboarding,
  onLogout,
  theme,
  onThemeToggle,
  children
}) => {
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [projectToDuplicate, setProjectToDuplicate] = useState<{ id: string; name: string } | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'priority' | 'due'>('newest');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallNudge, setShowInstallNudge] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallNudge(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Some browsers (like iOS Safari) don't support beforeinstallprompt
    // We can show a generic "How to Install" nudge if we detect those browsers,
    // but for now, let's just make sure the state is handled correctly.
    
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    if (isStandalone) {
      setShowInstallNudge(false);
    } else if (!('BeforeInstallPromptEvent' in window)) {
      // If the browser doesn't support the event, we might want to show instructions anyway
      // depending on the platform (e.g., iOS). For now, let's just log it.
      console.log('beforeinstallprompt not supported in this browser');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback for browsers that don't support the prompt (like iOS)
      alert('To install this app on your device: \n\n1. Tap the Share button\n2. Scroll down and tap "Add to Home Screen"');
      return;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setShowInstallNudge(false);
    }
    setDeferredPrompt(null);
  };

  const activeTasks = tasks
    .filter(t => !t.completed && !t.parentId)
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const weight = { high: 3, medium: 2, low: 1 };
        const valA = weight[a.priority || 'low'];
        const valB = weight[b.priority || 'low'];
        if (valA !== valB) return valB - valA;
      }
      if (sortBy === 'due') {
        const timeA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const timeB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        if (timeA !== timeB) return timeA - timeB;
      }
      const timeA = a.createdAt?.getTime?.() || 0;
      const timeB = b.createdAt?.getTime?.() || 0;
      return timeB - timeA;
    });

  const handleAddProject = (e: FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onAddProject(newProjectName.trim());
      setNewProjectName('');
      setIsAddingProject(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setProjectToDelete({ id, name });
  };

  const handleDuplicateClick = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setProjectToDuplicate({ id, name });
  };

  const getProjectProgress = (projectId: string) => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    if (projectTasks.length === 0) return 0;
    const completedTasks = projectTasks.filter(t => t.completed).length;
    return (completedTasks / projectTasks.length) * 100;
  };

  const inboxProject = projects.find(p => p.isInbox);
  const otherProjects = projects.filter(p => !p.isInbox);
  
  const activeProjects = otherProjects.filter(p => getProjectProgress(p.id) < 100);
  const completedProjects = otherProjects.filter(p => getProjectProgress(p.id) === 100);

  const renderProjectButton = (project: Project) => {
    const isInbox = project.isInbox;
    const progress = getProjectProgress(project.id);
    const isCompleted = progress === 100;
    
    return (
      <div 
        key={project.id}
        className={`group w-full flex items-center rounded-lg transition-all ${isSidebarCollapsed ? 'justify-center px-0 py-2' : 'justify-between px-4 py-2'} ${activeProjectId === project.id ? 'bg-action-indigo text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
      >
        <button 
          onClick={() => onSelectProject(project.id)}
          title={isSidebarCollapsed ? project.name : ''}
          className={`flex items-center flex-grow text-left focus:outline-none ${isSidebarCollapsed ? 'justify-center' : 'space-x-3 truncate'}`}
        >
          {isInbox ? (
            <InboxIcon className={`w-5 h-5 flex-shrink-0 ${activeProjectId === project.id ? 'text-white' : 'text-slate-400'}`} />
          ) : isCompleted ? (
            <Crown className="w-5 h-5 text-amber-400 animate-bounce flex-shrink-0" />
          ) : (
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSidebarCollapsed ? '' : 'mx-1.5'} ${project.completed ? 'bg-victory-green' : 'bg-slate-400'}`} />
          )}
          {!isSidebarCollapsed && (
            <span className={`truncate text-sm ${isCompleted && activeProjectId !== project.id ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}`}>
              {project.name}
            </span>
          )}
        </button>
        {!isSidebarCollapsed && !isInbox && (
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); handleDuplicateClick(e, project.id, project.name); }}
              className={`p-1 rounded hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${activeProjectId === project.id ? 'text-indigo-100' : 'text-slate-400'}`}
              title="Duplicate project"
              aria-label={`Duplicate project ${project.name}`}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleDeleteClick(e, project.id, project.name); }}
              className={`p-1 rounded hover:bg-white/20 transition-colors hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${activeProjectId === project.id ? 'text-indigo-100' : 'text-slate-400'}`}
              title="Delete project"
              aria-label={`Delete project ${project.name}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const cycleTheme = () => {
    if (theme === 'system') onThemeToggle('light');
    else if (theme === 'light') onThemeToggle('dark');
    else onThemeToggle('system');
  };

  const ThemeIcon = theme === 'system' ? Monitor : theme === 'dark' ? Moon : Sun;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 relative`}>
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 shadow-md z-10 hover:text-action-indigo transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-action-indigo"
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className={`p-6 ${isSidebarCollapsed ? 'px-2 flex justify-center' : ''}`}>
          <h2 className="text-2xl font-bold text-action-indigo flex items-center space-x-2 truncate">
            <CheckSquare className="w-8 h-8 flex-shrink-0" />
            {!isSidebarCollapsed && <span>CheckMate</span>}
          </h2>
        </div>

        <nav className={`flex-grow p-4 space-y-6 overflow-y-auto custom-scrollbar overflow-x-hidden ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
          {/* Command Center: Board & Inbox */}
          <div className="space-y-1">
            <button 
              onClick={() => onSelectProject(null)}
              title={isSidebarCollapsed ? 'The Board' : ''}
              className={`w-full flex items-center rounded-lg transition-colors ${isSidebarCollapsed ? 'justify-center px-0 py-2' : 'space-x-3 px-4 py-2'} ${!activeProjectId ? 'bg-action-indigo text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="text-sm font-medium">The Board</span>}
            </button>

            {inboxProject && (
              <button 
                onClick={() => onSelectProject(inboxProject.id)}
                title={isSidebarCollapsed ? 'Inbox' : ''}
                className={`w-full flex items-center rounded-lg transition-colors ${isSidebarCollapsed ? 'justify-center px-0 py-2' : 'space-x-3 px-4 py-2'} ${activeProjectId === inboxProject.id ? 'bg-action-indigo text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <InboxIcon className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="text-sm font-medium">Inbox</span>}
              </button>
            )}
          </div>

          {/* Active Projects */}
          <div className="space-y-4">
            <div className={`px-4 flex items-center justify-between ${isSidebarCollapsed ? 'px-0 justify-center' : ''}`}>
              {!isSidebarCollapsed && <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Projects</h3>}
            <button 
                onClick={() => {
                  if (isSidebarCollapsed) setIsSidebarCollapsed(false);
                  setIsAddingProject(!isAddingProject);
                }}
                className="text-slate-400 hover:text-action-indigo transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-action-indigo rounded"
                title="Add Project"
                aria-label="Add new project"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {!isSidebarCollapsed && isAddingProject && (
              <form onSubmit={handleAddProject} className="px-4">
                <input 
                  autoFocus
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm outline-none focus:border-action-indigo"
                />
              </form>
            )}

            <div className="space-y-1">
              {activeProjects.map(renderProjectButton)}
            </div>
          </div>

          {completedProjects.length > 0 && (
            <div className="space-y-2">
              <div className={`px-4 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
                {!isSidebarCollapsed ? (
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Checkmated</h3>
                ) : (
                  <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />
                )}
              </div>
              <div className="space-y-1">
                {completedProjects.map(renderProjectButton)}
              </div>
            </div>
          )}
        </nav>

        <div className={`p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 ${isSidebarCollapsed ? 'px-4 flex flex-col items-center space-y-4' : 'space-y-2'}`}>
          {/* PWA Install Nudge */}
          {showInstallNudge && (
            <button 
              onClick={handleInstallClick}
              className={`flex items-center space-x-3 px-4 py-2 rounded-lg bg-action-indigo/10 text-action-indigo hover:bg-action-indigo hover:text-white transition-all w-full border border-action-indigo/20 ${isSidebarCollapsed ? 'justify-center' : ''}`}
              title="Install CheckMate"
            >
              <Download className="w-5 h-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="text-sm font-bold">Install App</span>}
            </button>
          )}

          {/* Theme Toggle */}
          <button 
            onClick={cycleTheme}
            className={`flex items-center space-x-3 px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title={`Theme: ${theme}`}
          >
            <ThemeIcon className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span className="text-sm font-medium capitalize">{theme} Mode</span>}
          </button>

          {/* Settings Toggle */}
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className={`flex items-center space-x-3 px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title="Settings"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span className="text-sm font-medium">Settings</span>}
          </button>

          <div className={`flex items-center space-x-3 px-2 py-2 w-full ${isSidebarCollapsed ? 'justify-center mb-0' : ''}`}>
            {user.photoURL && <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex-shrink-0" />}
            {!isSidebarCollapsed && <span className="text-sm font-medium truncate">{user.displayName}</span>}
          </div>
          <button 
            onClick={onLogout}
            title={isSidebarCollapsed ? 'Logout' : ''}
            className={`flex items-center space-x-3 px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 transition-colors rounded-lg w-full ${isSidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isSidebarCollapsed && <span className="text-sm font-medium text-red-600">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto">
        <div className="h-full py-8 px-8">
          {!activeProjectId ? (
            <div className="max-w-5xl mx-auto">
              <header className="mb-8">
                <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">The Board</h1>
                <p className="text-slate-500">Your unified view of active tasks across all projects.</p>
              </header>

              <div className="mb-8">
                <SmartQuickAdd 
                  projects={projects} 
                  checklists={checklists}
                  onAddTask={onAddTask} 
                  activeProjectId={activeProjectId}
                />
              </div>

              <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
                  <div className="flex items-center space-x-4">
                    <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                      <ListTodo className="w-5 h-5 text-action-indigo" />
                      <span>Up Next</span>
                    </h2>
                    
                    <div className="flex items-center bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-tighter">
                      <button 
                        onClick={() => setSortBy('newest')}
                        className={`px-2 py-1 rounded-md transition-all ${sortBy === 'newest' ? 'bg-action-indigo text-white' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Newest
                      </button>
                      <button 
                        onClick={() => setSortBy('priority')}
                        className={`px-2 py-1 rounded-md transition-all ${sortBy === 'priority' ? 'bg-action-indigo text-white' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Priority
                      </button>
                      <button 
                        onClick={() => setSortBy('due')}
                        className={`px-2 py-1 rounded-md transition-all ${sortBy === 'due' ? 'bg-action-indigo text-white' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        Due Date
                      </button>
                    </div>
                  </div>
                  <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full font-bold text-slate-600 dark:text-slate-300 transition-colors">
                    {activeTasks.length} tasks
                  </span>
                </div>

                <div className="p-4 space-y-1">
                  {activeTasks.length > 0 ? (
                    activeTasks.map(task => (
                      <div key={task.id} className="relative group">
                        <TaskItem 
                          task={task} 
                          allTasks={tasks} 
                          projects={projects}
                          checklists={checklists}
                          onToggle={onToggleTask}
                          onAddSubtask={() => {}} // Disabled on Dashboard for simplicity
                          onEdit={onEditTask}
                          onUpdate={onUpdateTask}
                          onDelete={onDeleteTask}
                          onMove={onMoveTask}
                          hideGrip={true}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100/50 dark:bg-slate-800/50 px-2 py-0.5 rounded uppercase pointer-events-none group-hover:opacity-0 transition-opacity duration-200 max-w-[120px] truncate">
                          {projects.find(p => p.id === task.projectId)?.name}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-slate-400">
                      <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="font-medium text-lg">All caught up!</p>
                      <p className="text-sm">Time for a break?</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          ) : (
            children
          )}
        </div>
      </main>

      {/* Custom Confirmation Dialog */}
      <ConfirmationDialog 
        isOpen={!!projectToDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${projectToDelete?.name}"? This action cannot be undone and all tasks within it will be lost.`}
        confirmLabel="Delete Project"
        onConfirm={() => projectToDelete && onDeleteProject(projectToDelete.id)}
        onCancel={() => setProjectToDelete(null)}
        isDanger={true}
      />

      {/* Duplicate Project Dialog */}
      <DuplicateProjectDialog 
        isOpen={!!projectToDuplicate}
        projectName={projectToDuplicate?.name || ''}
        onConfirm={(newName, copyTasks) => projectToDuplicate && onDuplicateProject(projectToDuplicate.id, newName, copyTasks)}
        onCancel={() => setProjectToDuplicate(null)}
      />

      {/* User Settings Dialog */}
      <SettingsDialog 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onDeleteData={onDeleteAccountData}
        onResetOnboarding={onResetOnboarding}
      />
    </div>
  );
};

export default Dashboard;
