/**
 * Task Service
 * Business logic for task management
 */

import { Task, TaskStatus, Priority } from '../types/gtd';
import storageService from './storage.service';
import { generateId } from '../utils/id-generator';

class TaskService {
  /**
   * Get all tasks
   */
  async getAllTasks(): Promise<Task[]> {
    const data = await storageService.getData();
    return data.tasks;
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    const tasks = await this.getAllTasks();
    return tasks.filter(task => task.status === status && !task.completed);
  }

  /**
   * Get inbox tasks (only tasks without due date and in inbox status)
   */
  async getInboxTasks(): Promise<Task[]> {
    const tasks = await this.getAllTasks();
    return tasks.filter(task => 
      task.status === 'inbox' && 
      !task.completed && 
      !task.dueDate
    );
  }

  /**
   * Get today's tasks
   */
  async getTodayTasks(): Promise<Task[]> {
    const tasks = await this.getAllTasks();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tasks.filter(task => {
      if (task.completed) return false;
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    });
  }

  /**
   * Get tomorrow's tasks
   */
  async getTomorrowTasks(): Promise<Task[]> {
    const tasks = await this.getAllTasks();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    return tasks.filter(task => {
      if (task.completed) return false;
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= tomorrow && dueDate < dayAfter;
    });
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(): Promise<Task[]> {
    const tasks = await this.getAllTasks();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks.filter(task => {
      if (task.completed) return false;
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate < today;
    });
  }

  /**
   * Get tasks by project
   */
  async getTasksByProject(projectId: string): Promise<Task[]> {
    const tasks = await this.getAllTasks();
    return tasks.filter(task => task.projectId === projectId && !task.completed);
  }

  /**
   * Get tasks by tag
   */
  async getTasksByTag(tagId: string): Promise<Task[]> {
    const tasks = await this.getAllTasks();
    return tasks.filter(task => task.tagIds.includes(tagId) && !task.completed);
  }

  /**
   * Get completed tasks
   */
  async getCompletedTasks(): Promise<Task[]> {
    const tasks = await this.getAllTasks();
    return tasks.filter(task => task.completed).sort((a, b) => 
      (b.completedAt || 0) - (a.completedAt || 0)
    );
  }

  /**
   * Create a new task
   */
  async createTask(taskData: Partial<Task>): Promise<Task> {
    const data = await storageService.getData();
    
    const newTask: Task = {
      id: generateId(),
      title: taskData.title || '',
      description: taskData.description,
      status: taskData.status || 'inbox',
      priority: taskData.priority,
      dueDate: taskData.dueDate,
      projectId: taskData.projectId,
      tagIds: taskData.tagIds || [],
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    data.tasks.push(newTask);
    await storageService.saveData(data);
    
    return newTask;
  }

  /**
   * Update a task
   */
  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const data = await storageService.getData();
    const taskIndex = data.tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    const currentTask = data.tasks[taskIndex];
    const updatedTask = {
      ...currentTask,
      ...updates,
      id: taskId,
      updatedAt: Date.now(),
    };

    // Auto-move out of inbox only when task gets a due date or status change
    if (currentTask.status === 'inbox') {
      if (updates.dueDate || (updates.status && updates.status !== 'inbox')) {
        updatedTask.status = updates.status || 'next';
      }
    }

    data.tasks[taskIndex] = updatedTask;
    await storageService.saveData(data);
    
    return updatedTask;
  }

  /**
   * Mark task as complete
   */
  async completeTask(taskId: string): Promise<Task> {
    return this.updateTask(taskId, {
      completed: true,
      completedAt: Date.now(),
    });
  }

  /**
   * Mark task as incomplete
   */
  async uncompleteTask(taskId: string): Promise<Task> {
    return this.updateTask(taskId, {
      completed: false,
      completedAt: undefined,
    });
  }

  /**
   * Move task to different status
   */
  async moveTask(taskId: string, status: TaskStatus): Promise<Task> {
    return this.updateTask(taskId, { status });
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<void> {
    const data = await storageService.getData();
    data.tasks = data.tasks.filter(t => t.id !== taskId);
    await storageService.saveData(data);
  }

  /**
   * Archive completed tasks older than specified days
   */
  async archiveOldCompletedTasks(daysOld: number = 30): Promise<number> {
    const data = await storageService.getData();
    const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    
    const beforeCount = data.tasks.length;
    data.tasks = data.tasks.filter(task => {
      if (!task.completed) return true;
      if (!task.completedAt) return true;
      return task.completedAt > cutoffDate;
    });
    
    await storageService.saveData(data);
    return beforeCount - data.tasks.length;
  }
}

export default new TaskService();
