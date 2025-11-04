/**
 * GTD Data Models
 * Based on David Allen's Getting Things Done methodology
 */

export type Priority = 'low' | 'medium' | 'high';

export type TaskStatus = 'waiting' | 'someday';

export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  goal?: string;
  color?: string;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: number; // timestamp
  projectId?: string;
  tagIds: string[];
  completed: boolean;
  completedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface GTDData {
  tasks: Task[];
  projects: Project[];
  tags: Tag[];
  version: string;
  lastSync?: number;
  syncHash?: string;
}

export interface SyncMetadata {
  lastSyncTimestamp: number;
  syncHash: string;
  conflictDetected: boolean;
}
