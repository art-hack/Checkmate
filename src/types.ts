export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  createdAt: any; // Firestore Timestamp
  completed: boolean;
  progress: number;
  isInbox?: boolean;
}

export interface Checklist {
  id: string;
  name: string;
  projectId: string;
  order: number;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  projectId: string;
  checklistId: string;
  parentId: string | null;
  ownerId: string;
  order: number;
  createdAt: Date; // Firestore Timestamp or Date
}
