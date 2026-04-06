import { useState, type FC, type ReactNode, type FormEvent } from 'react';
import { LayoutDashboard, CheckSquare, ListTodo, LogOut, Plus } from 'lucide-react';
import SmartQuickAdd from './SmartQuickAdd';
import TaskItem from './TaskItem';
import type { Project, Task, User, Checklist } from './types';

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
  onAddProject: (name: string) => void;
  onLogout: () => void;
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
  onAddProject,
  onLogout,
  children
}) => {
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const activeTasks = tasks.filter(t => !t.completed).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const handleAddProject = (e: FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onAddProject(newProjectName.trim());
      setNewProjectName('');
      setIsAddingProject(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-action-indigo flex items-center space-x-2">
            <CheckSquare className="w-8 h-8" />
            <span>CheckMate</span>
          </h2>
        </div>

        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => onSelectProject(null)}
            className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${!activeProjectId ? 'bg-action-indigo text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>The Board</span>
          </button>

          <div className="pt-4">
            <div className="px-4 flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Projects</h3>
              <button 
                onClick={() => setIsAddingProject(!isAddingProject)}
                className="text-slate-400 hover:text-action-indigo transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {isAddingProject && (
              <form onSubmit={handleAddProject} className="px-4 mb-4">
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
              {projects.map(project => (
                <button 
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${activeProjectId === project.id ? 'bg-action-indigo text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${project.completed ? 'bg-victory-green' : 'bg-slate-400'}`} />
                  <span className="truncate text-sm">{project.name}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3 px-4 py-2 mb-4">
            {user.photoURL && <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full" />}
            <span className="text-sm font-medium truncate">{user.displayName}</span>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 transition-colors rounded-lg"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto">
        <div className="h-full py-8 px-8">
          {!activeProjectId ? (
            <div className="max-w-5xl mx-auto">
              <header className="mb-8">
                <h1 className="text-3xl font-bold mb-2">The Board</h1>
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

              <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h2 className="font-semibold flex items-center space-x-2">
                    <ListTodo className="w-5 h-5 text-action-indigo" />
                    <span>Up Next</span>
                  </h2>
                  <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-full font-bold">
                    {activeTasks.length} tasks
                  </span>
                </div>

                <div className="p-2 space-y-1">
                  {activeTasks.length > 0 ? (
                    activeTasks.map(task => (
                      <div key={task.id} className="relative">
                        <TaskItem 
                          task={task} 
                          allTasks={tasks} 
                          onToggle={onToggleTask}
                          onAddSubtask={() => {}} // Disabled on Dashboard for simplicity
                          onEdit={onEditTask}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase">
                          {projects.find(p => p.id === task.projectId)?.name}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-slate-400">
                      <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>All caught up! Time for a break?</p>
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
    </div>
  );
};

export default Dashboard;
