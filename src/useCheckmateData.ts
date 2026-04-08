import { useState } from 'react';
import type { Project, Checklist, Task, User } from './types';
import { MOCK_PROJECTS, MOCK_CHECKLISTS, MOCK_TASKS } from './mockData';

export const useCheckmateData = (user: User | null) => {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [checklists, setChecklists] = useState<Checklist[]>(MOCK_CHECKLISTS);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);

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

  const handleReorderChecklists = (_projectId: string, newOrderedChecklists: Checklist[]) => {
    const updatedChecklists = [...checklists];
    newOrderedChecklists.forEach((checklist, index) => {
      const checklistIndex = updatedChecklists.findIndex(c => c.id === checklist.id);
      if (checklistIndex !== -1) {
        updatedChecklists[checklistIndex] = { ...updatedChecklists[checklistIndex], order: index + 1 };
      }
    });
    setChecklists(updatedChecklists);
  };

  const handleDeleteTask = (taskId: string) => {
    const findDescendantIds = (parentId: string): string[] => {
      const children = tasks.filter(t => t.parentId === parentId);
      return children.reduce((acc, child) => [...acc, child.id, ...findDescendantIds(child.id)], [] as string[]);
    };

    const idsToDelete = [taskId, ...findDescendantIds(taskId)];
    setTasks(tasks.filter(t => !idsToDelete.includes(t.id)));
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
    return newProject.id;
  };

  const handleDeleteProject = (projectId: string) => {
    if (projectId === 'inbox') return;
    setProjects(projects.filter(p => p.id !== projectId));
    setChecklists(checklists.filter(c => c.projectId !== projectId));
    setTasks(tasks.filter(t => t.projectId !== projectId));
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
      sourceTasks.forEach(t => {
        taskIdMap[t.id] = Math.random().toString(36).substr(2, 9);
      });

      allNewTasks = sourceTasks.map(t => ({
        ...t,
        id: taskIdMap[t.id],
        projectId: newProjectId,
        checklistId: checklistIdMap[t.checklistId] || t.checklistId,
        parentId: t.parentId ? taskIdMap[t.parentId] : null,
        createdAt: new Date(),
        completed: false,
      }));
    }

    setProjects([...projects, newProject]);
    setChecklists([...checklists, ...newChecklists]);
    if (copyTasks) {
      setTasks([...tasks, ...allNewTasks]);
    }
    return newProjectId;
  };

  const handleDeleteChecklist = (checklistId: string) => {
    setChecklists(checklists.filter(c => c.id !== checklistId));
    setTasks(tasks.filter(t => t.checklistId !== checklistId));
  };

  const handleEditChecklist = (id: string, name: string) => {
    setChecklists(checklists.map(c => c.id === id ? { ...c, name } : c));
  };

  const handleClearDoneTasks = (projectId: string) => {
    setTasks(tasks.filter(t => !(t.projectId === projectId && t.completed)));
  };

  const onAddChecklist = (name: string, projectId: string) => {
    const newChecklist: Checklist = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      projectId,
      order: checklists.filter(c => c.projectId === projectId).length + 1,
    };
    setChecklists([...checklists, newChecklist]);
  };

  return {
    projects,
    checklists,
    tasks,
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
