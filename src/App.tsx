import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, logout } from './firebase';
import Dashboard from './Dashboard';
import ProjectView from './ProjectView';
import CommandPalette from './CommandPalette';
import OnboardingModal from './OnboardingModal';
import { useCheckmateData } from './useCheckmateData';
import type { User } from './types';
import { CheckSquare } from 'lucide-react';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Handle Global Shortcuts (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ctrl+K (or Cmd+K) - Toggle Command Palette
      // Use capture to beat browser address bar focus
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        setIsPaletteOpen(prev => !prev);
      }
    };

    // Use capture: true to ensure we catch the event before the browser defaults
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  const {
    projects,
    checklists,
    tasks,
    loading: dataLoading,
    handleAddTask,
    handleToggleTask,
    handleEditTask,
    handleUpdateTask,
    handleDeleteTask,
    handleMoveTask,
    handleReorderTasks,
    handleReorderChecklists,
    handleAddSubtask,
    handleAddProject,
    handleDeleteProject,
    handleDuplicateProject,
    handleDeleteChecklist,
    handleEditChecklist,
    handleClearDoneTasks,
    onAddChecklist,
    handleInitializeSampleData,
    handleDeleteAccountData
  } = useCheckmateData(user);

  // Check for new user (no projects besides Inbox)
  useEffect(() => {
    if (!dataLoading && user && projects.length > 0) {
      const hasOnlyInbox = projects.length === 1 && projects[0].isInbox;
      const seenOnboarding = localStorage.getItem(`onboarding_seen_${user.uid}`);
      
      if (hasOnlyInbox && !seenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [dataLoading, user, projects]);

  const onInitializeSample = async () => {
    const newId = await handleInitializeSampleData();
    if (newId) setActiveProjectId(newId);
    setShowOnboarding(false);
    if (user) localStorage.setItem(`onboarding_seen_${user.uid}`, 'true');
  };

  const closeOnboarding = () => {
    setShowOnboarding(false);
    if (user) localStorage.setItem(`onboarding_seen_${user.uid}`, 'true');
  };

  const onResetOnboarding = () => {
    if (user) localStorage.removeItem(`onboarding_seen_${user.uid}`);
    // If they only have Inbox, it will show immediately. 
    // If not, it will show next time they clear data.
    setShowOnboarding(true);
  };

  const onDeleteAccountData = async () => {
    if (window.confirm("ARE YOU ABSOLUTELY SURE? This will wipe all your projects and tasks forever.")) {
      await handleDeleteAccountData();
      setActiveProjectId(null);
      // After wiping, the useEffect for onboarding will trigger automatically
    }
  };

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('checkmate-theme');
    return (saved as 'light' | 'dark' | 'system') || 'system';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Apply Theme Logic
  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
      const systemDark = mediaQuery.matches;
      const isDark = theme === 'dark' || (theme === 'system' && systemDark);
      
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();
    
    mediaQuery.addEventListener('change', applyTheme);
    localStorage.setItem('checkmate-theme', theme);
    
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [theme]);

  const onAddProject = async (name: string) => {
    const newId = await handleAddProject(name);
    if (newId) setActiveProjectId(newId);
  };

  const onDuplicateProject = async (projectId: string, newName: string, copyTasks: boolean) => {
    const newId = await handleDuplicateProject(projectId, newName, copyTasks);
    if (newId) setActiveProjectId(newId);
  };

  if (authLoading || (user && dataLoading)) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-action-indigo font-bold italic">
        <div className="flex flex-col items-center space-y-4">
          <CheckSquare className="w-12 h-12 animate-pulse" />
          <span>Loading Strategy...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 text-center max-w-sm w-full">
          <CheckSquare className="w-16 h-16 text-action-indigo mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-2">CheckMate</h1>
          <p className="text-slate-500 mb-8">Master your projects with strategic precision.</p>
          <button 
            onClick={signInWithGoogle}
            className="w-full bg-action-indigo text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  const activeProject = projects.find(p => p.id === activeProjectId);
  const activeProjectChecklists = checklists.filter(c => c.projectId === activeProjectId).sort((a, b) => a.order - b.order);
  const activeProjectTasks = tasks.filter(t => t.projectId === activeProjectId);

  return (
    <div className="h-screen flex flex-col">
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={closeOnboarding} 
        onInitializeSample={onInitializeSample} 
      />
      <CommandPalette 
        projects={projects}
        tasks={tasks}
        onSelectProject={setActiveProjectId}
        isOpen={isPaletteOpen}
        onOpenChange={setIsPaletteOpen}
      />
      <Dashboard 
        user={user}
        projects={projects}
        checklists={checklists}
        tasks={tasks}
        activeProjectId={activeProjectId}
        onSelectProject={setActiveProjectId}
        onAddTask={handleAddTask}
        onToggleTask={handleToggleTask}
        onEditTask={handleEditTask}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onMoveTask={handleMoveTask}
        onAddProject={onAddProject}
        onDeleteProject={handleDeleteProject}
        onDuplicateProject={onDuplicateProject}
        onDeleteAccountData={onDeleteAccountData}
        onResetOnboarding={onResetOnboarding}
        onLogout={logout}
        theme={theme}
        onThemeToggle={setTheme}
      >
        {activeProjectId && activeProject && (
          <ProjectView 
            project={activeProject}
            checklists={activeProjectChecklists}
            tasks={activeProjectTasks}
            allProjects={projects}
            allChecklists={checklists}
            onToggleTask={handleToggleTask}
            onAddSubtask={handleAddSubtask}
            onEditTask={handleEditTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onMoveTask={handleMoveTask}
            onAddTask={handleAddTask}
            onReorderTasks={handleReorderTasks}
            onReorderChecklists={handleReorderChecklists}
            onDeleteChecklist={handleDeleteChecklist}
            onEditChecklist={handleEditChecklist}
            onClearDoneTasks={handleClearDoneTasks}
            onAddChecklist={(name) => onAddChecklist(name, activeProjectId)}
          />
        )}
      </Dashboard>
    </div>
  );
}

export default App;
