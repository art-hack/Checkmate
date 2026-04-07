import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, logout } from './firebase';
import Dashboard from './Dashboard';
import ProjectView from './ProjectView';
import type { User, Project, Checklist, Task } from './types';
import { CheckSquare } from 'lucide-react';

// Mock Data
const MOCK_PROJECTS: Project[] = [
  { id: 'inbox', name: 'Inbox', ownerId: 'u1', createdAt: new Date(), completed: false, progress: 0 },
  { id: '1', name: 'Website Redesign', ownerId: 'u1', createdAt: new Date(), completed: false, progress: 45 },
  { id: '2', name: 'App Backend', ownerId: 'u1', createdAt: new Date(), completed: false, progress: 100 },
];

const MOCK_CHECKLISTS: Checklist[] = [
  { id: 'c-inbox', name: 'General', projectId: 'inbox', order: 1 },
  { id: 'c1', name: 'Design', projectId: '1', order: 1 },
  { id: 'c2', name: 'Content', projectId: '1', order: 2 },
  { id: 'c3', name: 'Development', projectId: '2', order: 1 },
];

const MOCK_TASKS: Task[] = [
  { id: 't1', text: 'Create wireframes', completed: true, projectId: '1', checklistId: 'c1', parentId: null, ownerId: 'u1', order: 1, createdAt: new Date() },
  { id: 't2', text: 'Mobile view', completed: false, projectId: '1', checklistId: 'c1', parentId: 't1', ownerId: 'u1', order: 1, createdAt: new Date() },
  { id: 't3', text: 'Write copy', completed: false, projectId: '1', checklistId: 'c2', parentId: null, ownerId: 'u1', order: 1, createdAt: new Date() },
  { id: 't4', text: 'API Design', completed: true, projectId: '2', checklistId: 'c3', parentId: null, ownerId: 'u1', order: 1, createdAt: new Date() },
];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [checklists, setChecklists] = useState<Checklist[]>(MOCK_CHECKLISTS);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);

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
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddTask = (text: string, projectId: string, checklistId: string) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      completed: false,
      projectId: projectId || 'inbox',
      checklistId: checklistId || (checklists.find(c => c.projectId === (projectId || 'inbox'))?.id || 'c-inbox'),
      parentId: null,
      ownerId: user?.uid || 'u1',
      order: tasks.filter(t => t.projectId === projectId && t.checklistId === checklistId).length + 1,
      createdAt: new Date(),
    };
    setTasks([...tasks, newTask]);
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const handleEditTask = (taskId: string, newText: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, text: newText } : t));
  };

  const handleMoveTask = (taskId: string, newProjectId: string, newChecklistId: string) => {
    const findDescendantIds = (parentId: string): string[] => {
      const children = tasks.filter(t => t.parentId === parentId);
      return children.reduce((acc, child) => [...acc, child.id, ...findDescendantIds(child.id)], [] as string[]);
    };

    const idsToMove = [taskId, ...findDescendantIds(taskId)];
    setTasks(tasks.map(t => idsToMove.includes(t.id) ? { ...t, projectId: newProjectId, checklistId: newChecklistId } : t));
  };

  const handleReorderTasks = (_projectId: string, _checklistId: string, _parentId: string | null, newOrderedTasks: Task[]) => {
    const updatedTasks = [...tasks];
    
    newOrderedTasks.forEach((task, index) => {
      const taskIndex = updatedTasks.findIndex(t => t.id === task.id);
      if (taskIndex !== -1) {
        updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], order: index + 1 };
      }
    });

    setTasks(updatedTasks);
  };

  const handleAddSubtask = (parentId: string, text: string) => {
    const parentTask = tasks.find(t => t.id === parentId);
    if (!parentTask) return;

    const newSubtask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      completed: false,
      projectId: parentTask.projectId,
      checklistId: parentTask.checklistId,
      parentId,
      ownerId: user?.uid || 'u1',
      order: tasks.filter(t => t.parentId === parentId).length + 1,
      createdAt: new Date(),
    };
    setTasks([...tasks, newSubtask]);
  };

  const handleAddProject = (name: string) => {
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      ownerId: user?.uid || 'u1',
      createdAt: new Date(),
      completed: false,
      progress: 0,
    };
    setProjects([...projects, newProject]);
    
    const newChecklist: Checklist = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'General',
      projectId: newProject.id,
      order: 1,
    };
    setChecklists([...checklists, newChecklist]);
    setActiveProjectId(newProject.id);
  };

  const handleDeleteProject = (projectId: string) => {
    if (projectId === 'inbox') return;
    setProjects(projects.filter(p => p.id !== projectId));
    setChecklists(checklists.filter(c => c.projectId !== projectId));
    setTasks(tasks.filter(t => t.projectId !== projectId));
    if (activeProjectId === projectId) setActiveProjectId(null);
  };

  const handleDuplicateProject = (projectId: string, newName: string, copyTasks: boolean) => {
    const sourceProject = projects.find(p => p.id === projectId);
    if (!sourceProject) return;

    const newProjectId = Math.random().toString(36).substr(2, 9);
    const newProject: Project = {
      ...sourceProject,
      id: newProjectId,
      name: newName,
      createdAt: new Date(),
      completed: false,
      progress: 0,
    };

    // Duplicate Checklists
    const sourceChecklists = checklists.filter(c => c.projectId === projectId);
    const checklistIdMap: { [key: string]: string } = {};
    const newChecklists = sourceChecklists.map(c => {
      const newId = Math.random().toString(36).substr(2, 9);
      checklistIdMap[c.id] = newId;
      return { ...c, id: newId, projectId: newProjectId };
    });

    let allNewTasks: Task[] = [];
    if (copyTasks) {
      const sourceTasks = tasks.filter(t => t.projectId === projectId);
      const taskIdMap: { [key: string]: string } = {};
      
      // First pass: Create new IDs and map them
      sourceTasks.forEach(t => {
        taskIdMap[t.id] = Math.random().toString(36).substr(2, 9);
      });

      // Second pass: Create new task objects with mapped IDs
      allNewTasks = sourceTasks.map(t => ({
        ...t,
        id: taskIdMap[t.id],
        projectId: newProjectId,
        checklistId: checklistIdMap[t.checklistId] || t.checklistId,
        parentId: t.parentId ? taskIdMap[t.parentId] : null,
        createdAt: new Date(),
        completed: false, // Reset completion status for templates
      }));
    }

    setProjects([...projects, newProject]);
    setChecklists([...checklists, ...newChecklists]);
    if (copyTasks) {
      setTasks([...tasks, ...allNewTasks]);
    }
    setActiveProjectId(newProjectId);
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-action-indigo">Loading...</div>;
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
  const activeProjectChecklists = checklists.filter(c => c.projectId === activeProjectId);
  const activeProjectTasks = tasks.filter(t => t.projectId === activeProjectId);

  return (
    <div className="h-screen flex flex-col">
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
        onMoveTask={handleMoveTask}
        onAddProject={handleAddProject}
        onDeleteProject={handleDeleteProject}
        onDuplicateProject={handleDuplicateProject}
        onLogout={logout}
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
            onMoveTask={handleMoveTask}
            onAddTask={handleAddTask}
            onReorderTasks={handleReorderTasks}
            onAddChecklist={(name) => {
              const newChecklist: Checklist = {
                id: Math.random().toString(36).substr(2, 9),
                name,
                projectId: activeProjectId,
                order: checklists.length + 1,
              };
              setChecklists([...checklists, newChecklist]);
            }}
            onEditChecklist={(id, name) => {
              setChecklists(checklists.map(c => c.id === id ? { ...c, name } : c));
            }}
          />
        )}
      </Dashboard>
    </div>
  );
}

export default App;
