/**
 * Tag Service
 * Business logic for tag management
 */

import { Tag } from '../types/gtd';
import storageService from './storage.service';
import { generateId } from '../utils/id-generator';

class TagService {
  /**
   * Get all tags
   */
  async getAllTags(): Promise<Tag[]> {
    const data = await storageService.getData();
    return data.tags;
  }

  /**
   * Get tag by ID
   */
  async getTagById(tagId: string): Promise<Tag | undefined> {
    const data = await storageService.getData();
    return data.tags.find(t => t.id === tagId);
  }

  /**
   * Create a new tag
   */
  async createTag(tagData: Partial<Tag>): Promise<Tag> {
    const data = await storageService.getData();
    
    // Check if tag with same name already exists
    const existingTag = data.tags.find(
      t => t.name.toLowerCase() === tagData.name?.toLowerCase()
    );
    
    if (existingTag) {
      return existingTag;
    }

    const newTag: Tag = {
      id: generateId(),
      name: tagData.name || '',
      color: tagData.color,
      createdAt: Date.now(),
    };

    data.tags.push(newTag);
    await storageService.saveData(data);
    
    return newTag;
  }

  /**
   * Update a tag
   */
  async updateTag(tagId: string, updates: Partial<Tag>): Promise<Tag> {
    const data = await storageService.getData();
    const tagIndex = data.tags.findIndex(t => t.id === tagId);
    
    if (tagIndex === -1) {
      throw new Error('Tag not found');
    }

    const updatedTag = {
      ...data.tags[tagIndex],
      ...updates,
      id: tagId,
    };

    data.tags[tagIndex] = updatedTag;
    await storageService.saveData(data);
    
    return updatedTag;
  }

  /**
   * Delete a tag
   */
  async deleteTag(tagId: string): Promise<void> {
    const data = await storageService.getData();
    
    // Remove tag
    data.tags = data.tags.filter(t => t.id !== tagId);
    
    // Remove tag reference from tasks
    data.tasks = data.tasks.map(task => {
      if (task.tagIds.includes(tagId)) {
        return {
          ...task,
          tagIds: task.tagIds.filter(id => id !== tagId),
          updatedAt: Date.now(),
        };
      }
      return task;
    });
    
    await storageService.saveData(data);
  }

  /**
   * Get task count for a tag
   */
  async getTagTaskCount(tagId: string): Promise<number> {
    const data = await storageService.getData();
    return data.tasks.filter(t => t.tagIds.includes(tagId) && !t.completed).length;
  }

  /**
   * Get or create tag by name
   */
  async getOrCreateTag(tagName: string, color?: string): Promise<Tag> {
    const data = await storageService.getData();
    
    const existingTag = data.tags.find(
      t => t.name.toLowerCase() === tagName.toLowerCase()
    );
    
    if (existingTag) {
      return existingTag;
    }

    return this.createTag({ name: tagName, color });
  }
}

export default new TagService();
