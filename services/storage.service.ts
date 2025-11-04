/**
 * Storage Service
 * Handles local data persistence using AsyncStorage
 * Data is stored as JSON for human readability and portability
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { GTDData, Task, Project, Tag, SyncMetadata } from '../types/gtd';

const STORAGE_KEY = '@taskflow_gtd_data';
const STORAGE_VERSION = '1.0.0';

class StorageService {
  private cache: GTDData | null = null;

  /**
   * Initialize storage with empty data structure
   */
  private getEmptyData(): GTDData {
    return {
      tasks: [],
      projects: [],
      tags: [],
      version: STORAGE_VERSION,
      lastSync: undefined,
      syncHash: undefined,
    };
  }

  /**
   * Load all data from storage
   */
  async loadData(): Promise<GTDData> {
    try {
      const jsonData = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (!jsonData) {
        const emptyData = this.getEmptyData();
        await this.saveData(emptyData);
        this.cache = emptyData;
        return emptyData;
      }

      const data: GTDData = JSON.parse(jsonData);
      this.cache = data;
      return data;
    } catch (error) {
      console.error('Error loading data:', error);
      throw new Error('Failed to load data from storage');
    }
  }

  /**
   * Save all data to storage
   */
  async saveData(data: GTDData): Promise<void> {
    try {
      data.version = STORAGE_VERSION;
      const jsonData = JSON.stringify(data, null, 2);
      await AsyncStorage.setItem(STORAGE_KEY, jsonData);
      this.cache = data;
    } catch (error) {
      console.error('Error saving data:', error);
      throw new Error('Failed to save data to storage');
    }
  }

  /**
   * Get current data (from cache if available)
   */
  async getData(): Promise<GTDData> {
    if (this.cache) {
      return this.cache;
    }
    return this.loadData();
  }

  /**
   * Export data as JSON file to device storage
   */
  async exportToFile(): Promise<string> {
    try {
      const data = await this.getData();
      const jsonData = JSON.stringify(data, null, 2);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `taskflow-export-${timestamp}.json`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      await FileSystem.writeAsStringAsync(fileUri, jsonData, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      return fileUri;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  }

  /**
   * Import data from JSON string
   */
  async importFromJson(jsonString: string): Promise<void> {
    try {
      const data: GTDData = JSON.parse(jsonString);
      
      // Validate basic structure
      if (!data.tasks || !data.projects || !data.tags) {
        throw new Error('Invalid data format');
      }
      
      await this.saveData(data);
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Failed to import data');
    }
  }

  /**
   * Calculate hash for sync conflict detection
   */
  private calculateHash(data: GTDData): string {
    const sortedData = {
      tasks: [...data.tasks].sort((a, b) => a.id.localeCompare(b.id)),
      projects: [...data.projects].sort((a, b) => a.id.localeCompare(b.id)),
      tags: [...data.tags].sort((a, b) => a.id.localeCompare(b.id)),
    };
    
    const str = JSON.stringify(sortedData);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Prepare sync metadata
   */
  async getSyncMetadata(): Promise<SyncMetadata> {
    const data = await this.getData();
    const hash = this.calculateHash(data);
    
    return {
      lastSyncTimestamp: data.lastSync || 0,
      syncHash: hash,
      conflictDetected: false,
    };
  }

  /**
   * Update sync metadata after successful sync
   */
  async updateSyncMetadata(): Promise<void> {
    const data = await this.getData();
    const hash = this.calculateHash(data);
    
    data.lastSync = Date.now();
    data.syncHash = hash;
    
    await this.saveData(data);
  }

  /**
   * Clear all data (for testing/reset)
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      this.cache = null;
    } catch (error) {
      console.error('Error clearing data:', error);
      throw new Error('Failed to clear data');
    }
  }

  /**
   * Check if conflict exists with remote data
   */
  async detectConflict(remoteHash: string): Promise<boolean> {
    const localMetadata = await this.getSyncMetadata();
    return localMetadata.syncHash !== remoteHash;
  }
}

export default new StorageService();
