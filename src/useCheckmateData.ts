import { useState, useEffect } from 'react';
import { 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  doc, 
  writeBatch, 
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db, projectsCol, checklistsCol, tasksCol, serverTimestamp } from './firebase';
import type { Project, Checklist, Task, User } from './types';

// Helper to convert Firestore data to our app types
const mapDoc = <T>(doc: any): T => {
  const data = doc.data();
  // Convert Timestamps to Dates for the UI
  Object.keys(data).forEach(key => {
    if (data[key] instanceof Timestamp) {
      data[key] = data[key].toDate();
    }
  });
  return { id: doc.id, ...data } as T;
};

export const useCheckmateData = (user: User | null) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setChecklists([]);
      setTasks([]);
      setLoading(false);
      return;
    }

    // Note: These queries require Composite Indexes in Firestore.
    // Check your browser console for links to create them if queries fail.
    const qProjects = query(projectsCol, where("ownerId", "==", user.uid), orderBy("createdAt", "desc"));
    const qChecklists = query(checklistsCol, where("ownerId", "==", user.uid), orderBy("order", "asc"));
    const qTasks = query(tasksCol, where("ownerId", "==", user.uid), orderBy("order", "asc"));

    const unsubProjects = onSnapshot(qProjects, (snapshot) => {
      const projectsData = snapshot.docs.map(d => mapDoc<Project>(d));
      setProjects(projectsData);
      
      const hasInbox = projectsData.some(p => p.isInbox);
      if (!hasInbox && !snapshot.metadata.fromCache) {
        initializeUserInbox(user.uid);
      }
    }, (err) => console.error("Projects Listener Error:", err));

    const unsubChecklists = onSnapshot(qChecklists, (snapshot) => {
      setChecklists(snapshot.docs.map(d => mapDoc<Checklist>(d)));
    }, (err) => console.error("Checklists Listener Error:", err));

    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      setTasks(snapshot.docs.map(d => mapDoc<Task>(d)));
      setLoading(false);
    }, (err) => console.error("Tasks Listener Error:", err));

    return () => {
      unsubProjects();
      unsubChecklists();
      unsubTasks();
    };
  }, [user]);

  const initializeUserInbox = async (uid: string) => {
    try {
      const inboxRef = await addDoc(projectsCol, {
        name: 'Inbox',
        ownerId: uid,
        createdAt: serverTimestamp(),
        completed: false,
        progress: 0,
        isInbox: true
      });

      await addDoc(checklistsCol, {
        name: 'General',
        projectId: inboxRef.id,
        ownerId: uid,
        order: 1
      });
    } catch (err) {
      console.error("Inbox Init Error:", err);
    }
  };

  const handleAddTask = async (text: string, projectId: string, checklistId: string) => {
    if (!user) return;
    const siblingTasks = tasks.filter(t => t.projectId === projectId && t.checklistId === checklistId && !t.parentId);
    const maxOrder = siblingTasks.length > 0 ? Math.max(...siblingTasks.map(t => t.order || 0)) : 0;

    await addDoc(tasksCol, {
      text,
      completed: false,
      projectId,
      checklistId,
      parentId: null,
      ownerId: user.uid,
      order: maxOrder + 1,
      createdAt: serverTimestamp()
    });
  };

  const handleToggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    await updateDoc(doc(db, "tasks", taskId), {
      completed: !task.completed
    });
  };

  const handleEditTask = async (taskId: string, newText: string) => {
    await updateDoc(doc(db, "tasks", taskId), {
      text: newText
    });
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    await updateDoc(doc(db, "tasks", taskId), updates);
  };

  const handleMoveTask = async (taskId: string, newProjectId: string, newChecklistId: string) => {
    if (!user) return;
    const batch = writeBatch(db);
    const findDescendantIds = (parentId: string): string[] => {
      const children = tasks.filter(t => t.parentId === parentId);
      return children.reduce((acc, child) => [...acc, child.id, ...findDescendantIds(child.id)], [] as string[]);
    };
    const idsToMove = [taskId, ...findDescendantIds(taskId)];
    idsToMove.forEach(id => {
      batch.update(doc(db, "tasks", id), {
        projectId: newProjectId,
        checklistId: newChecklistId
      });
    });
    await batch.commit();
  };

  const handleReorderTasks = async (_projectId: string, _checklistId: string, _parentId: string | null, newOrderedTasks: Task[]) => {
    const batch = writeBatch(db);
    newOrderedTasks.forEach((task, index) => {
      batch.update(doc(db, "tasks", task.id), { order: index + 1 });
    });
    await batch.commit();
  };

  const handleReorderChecklists = async (_projectId: string, newOrderedChecklists: Checklist[]) => {
    const batch = writeBatch(db);
    newOrderedChecklists.forEach((checklist, index) => {
      batch.update(doc(db, "checklists", checklist.id), { order: index + 1 });
    });
    await batch.commit();
  };

  const handleDeleteTask = async (taskId: string) => {
    const batch = writeBatch(db);
    const findDescendantIds = (parentId: string): string[] => {
      const children = tasks.filter(t => t.parentId === parentId);
      return children.reduce((acc, child) => [...acc, child.id, ...findDescendantIds(child.id)], [] as string[]);
    };
    const idsToDelete = [taskId, ...findDescendantIds(taskId)];
    idsToDelete.forEach(id => batch.delete(doc(db, "tasks", id)));
    await batch.commit();
  };

  const handleAddSubtask = async (parentId: string, text: string) => {
    if (!user) return;
    const parentTask = tasks.find(t => t.id === parentId);
    if (!parentTask) return;
    const siblingTasks = tasks.filter(t => t.parentId === parentId);
    const maxOrder = siblingTasks.length > 0 ? Math.max(...siblingTasks.map(t => t.order || 0)) : 0;

    await addDoc(tasksCol, {
      text,
      completed: false,
      projectId: parentTask.projectId,
      checklistId: parentTask.checklistId,
      parentId,
      ownerId: user.uid,
      order: maxOrder + 1,
      createdAt: serverTimestamp()
    });
  };

  const handleAddProject = async (name: string) => {
    if (!user) return "";
    const docRef = await addDoc(projectsCol, {
      name,
      ownerId: user.uid,
      createdAt: serverTimestamp(),
      completed: false,
      progress: 0
    });
    await addDoc(checklistsCol, {
      name: 'General',
      projectId: docRef.id,
      ownerId: user.uid,
      order: 1
    });
    return docRef.id;
  };

  const handleDeleteProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project || project.isInbox) return;
    const batch = writeBatch(db);
    batch.delete(doc(db, "projects", projectId));
    checklists.filter(c => c.projectId === projectId).forEach(c => batch.delete(doc(db, "checklists", c.id)));
    tasks.filter(t => t.projectId === projectId).forEach(t => batch.delete(doc(db, "tasks", t.id)));
    await batch.commit();
  };

  const handleDuplicateProject = async (projectId: string, newName: string, copyTasks: boolean) => {
    if (!user) return "";
    const sourceProject = projects.find(p => p.id === projectId);
    if (!sourceProject) return "";

    const newProjectRef = await addDoc(projectsCol, {
      name: newName,
      ownerId: user.uid,
      createdAt: serverTimestamp(),
      completed: false,
      progress: 0
    });
    const newProjectId = newProjectRef.id;

    const sourceChecklists = checklists.filter(c => c.projectId === projectId);
    const checklistIdMap: { [key: string]: string } = {};
    for (const c of sourceChecklists) {
      const newChecklistRef = await addDoc(checklistsCol, {
        name: c.name,
        projectId: newProjectId,
        ownerId: user.uid,
        order: c.order
      });
      checklistIdMap[c.id] = newChecklistRef.id;
    }

    if (copyTasks) {
      const sourceTasks = tasks.filter(t => t.projectId === projectId);
      const rootTasks = sourceTasks.filter(t => !t.parentId);
      const duplicateTasksRecursive = async (oldTasks: Task[], newParentId: string | null) => {
        for (const t of oldTasks) {
          const newDocRef = await addDoc(tasksCol, {
            text: t.text,
            completed: false,
            projectId: newProjectId,
            checklistId: checklistIdMap[t.checklistId] || "",
            parentId: newParentId,
            ownerId: user.uid,
            order: t.order,
            createdAt: serverTimestamp()
          });
          const subtasks = sourceTasks.filter(st => st.parentId === t.id);
          if (subtasks.length > 0) await duplicateTasksRecursive(subtasks, newDocRef.id);
        }
      };
      await duplicateTasksRecursive(rootTasks, null);
    }
    return newProjectId;
  };

  const handleDeleteChecklist = async (checklistId: string) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, "checklists", checklistId));
    tasks.filter(t => t.checklistId === checklistId).forEach(t => batch.delete(doc(db, "tasks", t.id)));
    await batch.commit();
  };

  const handleEditChecklist = async (id: string, name: string) => {
    await updateDoc(doc(db, "checklists", id), { name });
  };

  const handleClearDoneTasks = async (projectId: string) => {
    const batch = writeBatch(db);
    tasks.filter(t => t.projectId === projectId && t.completed).forEach(t => batch.delete(doc(db, "tasks", t.id)));
    await batch.commit();
  };

  const handleDeleteAccountData = async () => {
    if (!user) return;
    const batch = writeBatch(db);
    
    // Delete all projects
    projects.forEach(p => batch.delete(doc(db, "projects", p.id)));
    // Delete all checklists
    checklists.forEach(c => batch.delete(doc(db, "checklists", c.id)));
    // Delete all tasks
    tasks.forEach(t => batch.delete(doc(db, "tasks", t.id)));
    
    await batch.commit();
    // After deletion, initializeUserInbox will be triggered by the useEffect listener
    // as projects.length will become 0
  };

  const onAddChecklist = async (name: string, projectId: string) => {
    if (!user) return;
    const projectChecklists = checklists.filter(c => c.projectId === projectId);
    const maxOrder = projectChecklists.length > 0 ? Math.max(...projectChecklists.map(c => c.order || 0)) : 0;
    await addDoc(checklistsCol, {
      name,
      projectId,
      ownerId: user.uid,
      order: maxOrder + 1
    });
  };

  const handleInitializeSampleData = async () => {
    if (!user) return;
    
    // 1. Create Chess-themed Sample Project
    const projectRef = await addDoc(projectsCol, {
      name: '♟️ Strategy: Grandmaster Path',
      ownerId: user.uid,
      createdAt: serverTimestamp(),
      completed: false,
      progress: 0
    });
    const projectId = projectRef.id;

    // 2. Create Parallel Checklists (The Board setup)
    const checklistData = [
      { name: '📖 Opening Theory', order: 1 },
      { name: '🧩 Tactical Drills', order: 2 },
      { name: '🏆 Tournament Prep', order: 3 }
    ];

    const checklistIds: string[] = [];
    for (const c of checklistData) {
      const cRef = await addDoc(checklistsCol, {
        name: c.name,
        projectId,
        ownerId: user.uid,
        order: c.order
      });
      checklistIds.push(cRef.id);
    }

    // 3. Add Tasks to showcase hierarchy and movement
    // Opening Theory Tasks
    const t1 = await addDoc(tasksCol, {
      text: 'Master the Sicilian Defense',
      completed: false,
      projectId,
      checklistId: checklistIds[0],
      parentId: null,
      ownerId: user.uid,
      order: 1,
      createdAt: serverTimestamp(),
      priority: 'high'
    });

    await addDoc(tasksCol, {
      text: 'Study the Najdorf Variation',
      completed: false,
      projectId,
      checklistId: checklistIds[0],
      parentId: t1.id,
      ownerId: user.uid,
      order: 1,
      createdAt: serverTimestamp()
    });

    await addDoc(tasksCol, {
      text: 'Review Queen\'s Gambit lines',
      completed: false,
      projectId,
      checklistId: checklistIds[0],
      parentId: null,
      ownerId: user.uid,
      order: 2,
      createdAt: serverTimestamp()
    });

    // Tactical Drills (More items to show reordering)
    const tacticalTasks = [
      'Solve 50 puzzles on Lichess',
      'Analyze 3 classic Tal games',
      'Practice endgame patterns',
      'Watch GothamChess recap'
    ];

    for (let i = 0; i < tacticalTasks.length; i++) {
      await addDoc(tasksCol, {
        text: tacticalTasks[i],
        completed: false,
        projectId,
        checklistId: checklistIds[1],
        parentId: null,
        ownerId: user.uid,
        order: i + 1,
        createdAt: serverTimestamp(),
        priority: i === 0 ? 'high' : 'medium'
      });
    }

    // Tournament Prep
    await addDoc(tasksCol, {
      text: 'Check tournament registration',
      completed: false,
      projectId,
      checklistId: checklistIds[2],
      parentId: null,
      ownerId: user.uid,
      order: 1,
      createdAt: serverTimestamp(),
      dueDate: new Date(Date.now() + 86400000 * 3) // 3 days from now
    });

    return projectId;
  };

  return {
    projects,
    checklists,
    tasks,
    loading,
    handleAddTask,
    handleToggleTask,
    handleEditTask,
    handleUpdateTask,
    handleMoveTask,
    handleReorderTasks,
    handleReorderChecklists,
    handleDeleteTask,
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
  };
};
