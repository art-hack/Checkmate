import type { Project, Checklist, Task } from './types';

export const MOCK_PROJECTS: Project[] = [
  { id: 'inbox', name: 'Inbox', ownerId: 'u1', createdAt: new Date(), completed: false, progress: 0 },
  { id: '1', name: 'Website Redesign', ownerId: 'u1', createdAt: new Date(), completed: false, progress: 45 },
  { id: '2', name: 'App Backend', ownerId: 'u1', createdAt: new Date(), completed: false, progress: 100 },
];

export const MOCK_CHECKLISTS: Checklist[] = [
  { id: 'c-inbox', name: 'General', projectId: 'inbox', order: 1 },
  { id: 'c1', name: 'Design', projectId: '1', order: 1 },
  { id: 'c2', name: 'Content', projectId: '1', order: 2 },
  { id: 'c3', name: 'Development', projectId: '2', order: 1 },
];

export const MOCK_TASKS: Task[] = [
  { id: 't1', text: 'Create wireframes', completed: true, projectId: '1', checklistId: 'c1', parentId: null, ownerId: 'u1', order: 1, createdAt: new Date() },
  { id: 't2', text: 'Mobile view', completed: false, projectId: '1', checklistId: 'c1', parentId: 't1', ownerId: 'u1', order: 1, createdAt: new Date() },
  { id: 't3', text: 'Write copy', completed: false, projectId: '1', checklistId: 'c2', parentId: null, ownerId: 'u1', order: 1, createdAt: new Date() },
  { id: 't4', text: 'API Design', completed: true, projectId: '2', checklistId: 'c3', parentId: null, ownerId: 'u1', order: 1, createdAt: new Date() },
];
