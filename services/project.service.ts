/**
 * Project Service
 * Business logic for project management
 */

import { Project } from '../types/gtd';
import storageService from './storage.service';
import { generateId } from '../utils/id-generator';

class ProjectService {
  /**
   * Get all projects
   */
  async getAllProjects(): Promise<Project[]> {
    const data = await storageService.getData();
    return data.projects.filter(p => !p.archived);
  }

  /**
   * Get archived projects
   */
  async getArchivedProjects(): Promise<Project[]> {
    const data = await storageService.getData();
    return data.projects.filter(p => p.archived);
  }

  /**
   * Get project by ID
   */
  async getProjectById(projectId: string): Promise<Project | undefined> {
    const data = await storageService.getData();
    return data.projects.find(p => p.id === projectId);
  }

  /**
   * Create a new project
   */
  async createProject(projectData: Partial<Project>): Promise<Project> {
    const data = await storageService.getData();
    
    const newProject: Project = {
      id: generateId(),
      name: projectData.name || '',
      description: projectData.description,
      goal: projectData.goal,
      color: projectData.color,
      archived: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    data.projects.push(newProject);
    await storageService.saveData(data);
    
    return newProject;
  }

  /**
   * Update a project
   */
  async updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
    const data = await storageService.getData();
    const projectIndex = data.projects.findIndex(p => p.id === projectId);
    
    if (projectIndex === -1) {
      throw new Error('Project not found');
    }

    const updatedProject = {
      ...data.projects[projectIndex],
      ...updates,
      id: projectId,
      updatedAt: Date.now(),
    };

    data.projects[projectIndex] = updatedProject;
    await storageService.saveData(data);
    
    return updatedProject;
  }

  /**
   * Archive a project
   */
  async archiveProject(projectId: string): Promise<Project> {
    return this.updateProject(projectId, { archived: true });
  }

  /**
   * Unarchive a project
   */
  async unarchiveProject(projectId: string): Promise<Project> {
    return this.updateProject(projectId, { archived: false });
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<void> {
    const data = await storageService.getData();
    
    // Remove project
    data.projects = data.projects.filter(p => p.id !== projectId);
    
    // Remove project reference from tasks
    data.tasks = data.tasks.map(task => {
      if (task.projectId === projectId) {
        return { ...task, projectId: undefined, updatedAt: Date.now() };
      }
      return task;
    });
    
    await storageService.saveData(data);
  }

  /**
   * Get task count for a project
   */
  async getProjectTaskCount(projectId: string): Promise<number> {
    const data = await storageService.getData();
    return data.tasks.filter(t => t.projectId === projectId && !t.completed).length;
  }
}

export default new ProjectService();
