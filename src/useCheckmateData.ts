import { useState, useEffect } from 'react';
import { 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  doc, 
  writeBatch, 
  orderBy
} from 'firebase/firestore';
import { db, projectsCol, checklistsCol, tasksCol, serverTimestamp } from './firebase';
import type { Project, Checklist, Task, User } from './types';

export const useCheckmateData = (user: User | null) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Real-time Listeners
  useEffect(() => {
    if (!user) {
      setProjects([]);
      setChecklists([]);
      setTasks([]);
      setLoading(false);
      return;
    }

    const qProjects = query(projectsCol, where("ownerId", "==", user.uid), orderBy("createdAt", "desc"));
    const qChecklists = query(checklistsCol, where("ownerId", "==", user.uid), orderBy("order", "asc"));
    const qTasks = query(tasksCol, where("ownerId", "==", user.uid), orderBy("order", "asc"));

    const unsubProjects = onSnapshot(qProjects, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projectsData);
      
      // Initialize Inbox if it doesn't exist
      const hasInbox = projectsData.some(p => p.isInbox);
      if (!hasInbox && snapshot.metadata.fromCache === false) {
        initializeUserInbox(user.uid);
      }
    });

    const unsubChecklists = onSnapshot(qChecklists, (snapshot) => {
      setChecklists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Checklist)));
    });

    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
      setLoading(false);
    });

    return () => {
      unsubProjects();
      unsubChecklists();
      unsubTasks();
    };
  }, [user]);

  // 2. Initialization Helpers
  const initializeUserInbox = async (uid: string) => {
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
  };

  // 3. Handlers
  const handleAddTask = async (text: string, projectId: string, checklistId: string) => {
    if (!user) return;
    
    // Find max order for sibling tasks
    const siblingTasks = tasks.filter(t => t.projectId === projectId && t.checklistId === checklistId && !t.parentId);
    const maxOrder = siblingTasks.length > 0 ? Math.max(...siblingTasks.map(t => t.order)) : 0;

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

  const handleMoveTask = async (taskId: string, newProjectId: string, newChecklistId: string) => {
    if (!user) return;
    const batch = writeBatch(db);
    
    // Find all descendants
    const findDescendantIds = (parentId: string): string[] => {
      const children = tasks.filter(t => t.parentId === parentId);
      return children.reduce((acc, child) => [...acc, child.id, ...findDescendantIds(child.id)], [] as string[]);
    };

    const idsToMove = [taskId, ...findDescendantIds(taskId)];
    
    idsToMove.forEach(id => {
      const taskRef = doc(db, "tasks", id);
      batch.update(taskRef, {
        projectId: newProjectId,
        checklistId: newChecklistId
      });
    });

    await batch.commit();
  };

  const handleReorderTasks = async (_projectId: string, _checklistId: string, _parentId: string | null, newOrderedTasks: Task[]) => {
    const batch = writeBatch(db);
    newOrderedTasks.forEach((task, index) => {
      const taskRef = doc(db, "tasks", task.id);
      batch.update(taskRef, { order: index + 1 });
    });
    await batch.commit();
  };

  const handleReorderChecklists = async (_projectId: string, newOrderedChecklists: Checklist[]) => {
    const batch = writeBatch(db);
    newOrderedChecklists.forEach((checklist, index) => {
      const checklistRef = doc(db, "checklists", checklist.id);
      batch.update(checklistRef, { order: index + 1 });
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
    idsToDelete.forEach(id => {
      batch.delete(doc(db, "tasks", id));
    });

    await batch.commit();
  };

  const handleAddSubtask = async (parentId: string, text: string) => {
    if (!user) return;
    const parentTask = tasks.find(t => t.id === parentId);
    if (!parentTask) return;

    const siblingTasks = tasks.filter(t => t.parentId === parentId);
    const maxOrder = siblingTasks.length > 0 ? Math.max(...siblingTasks.map(t => t.order)) : 0;

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

    const projectChecklists = checklists.filter(c => c.projectId === projectId);
    projectChecklists.forEach(c => batch.delete(doc(db, "checklists", c.id)));

    const projectTasks = tasks.filter(t => t.projectId === projectId);
    projectTasks.forEach(t => batch.delete(doc(db, "tasks", t.id)));

    await batch.commit();
  };

  const handleDuplicateProject = async (projectId: string, newName: string, copyTasks: boolean) => {
    if (!user) return "";
    const sourceProject = projects.find(p => p.id === projectId);
    if (!sourceProject) return "";

    // 1. Create new project
    const newProjectRef = await addDoc(projectsCol, {
      name: newName,
      ownerId: user.uid,
      createdAt: serverTimestamp(),
      completed: false,
      progress: 0
    });
    const newProjectId = newProjectRef.id;

    // 2. Duplicate Checklists
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

    // 3. Duplicate Tasks if requested
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
          if (subtasks.length > 0) {
            await duplicateTasksRecursive(subtasks, newDocRef.id);
          }
        }
      };

      await duplicateTasksRecursive(rootTasks, null);
    }

    return newProjectId;
  };

  const handleDeleteChecklist = async (checklistId: string) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, "checklists", checklistId));
    
    const checklistTasks = tasks.filter(t => t.checklistId === checklistId);
    checklistTasks.forEach(t => batch.delete(doc(db, "tasks", t.id)));
    
    await batch.commit();
  };

  const handleEditChecklist = async (id: string, name: string) => {
    await updateDoc(doc(db, "checklists", id), { name });
  };

  const handleClearDoneTasks = async (projectId: string) => {
    const batch = writeBatch(db);
    const doneTasks = tasks.filter(t => t.projectId === projectId && t.completed);
    doneTasks.forEach(t => batch.delete(doc(db, "tasks", t.id)));
    await batch.commit();
  };

  const onAddChecklist = async (name: string, projectId: string) => {
    if (!user) return;
    const projectChecklists = checklists.filter(c => c.projectId === projectId);
    const maxOrder = projectChecklists.length > 0 ? Math.max(...projectChecklists.map(c => c.order)) : 0;

    await addDoc(checklistsCol, {
      name,
      projectId,
      ownerId: user.uid,
      order: maxOrder + 1
    });
  };

  return {
    projects,
    checklists,
    tasks,
    loading,
    handleAddTask,
    handleToggleTask,
    handleEditTask,
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
    onAddChecklist
  };
};
