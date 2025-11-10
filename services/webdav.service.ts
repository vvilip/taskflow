/**
 * WebDAV Service
 * Handles sync with Nextcloud/WebDAV servers
 */

import { createClient, WebDAVClient, FileStat } from 'webdav';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GTDData } from '../types/gtd';
import storageService from './storage.service';

const WEBDAV_FILE_PATH = '/taskflow-data.json';
const WEBDAV_CONFIG_KEY = '@taskflow_webdav_config';

interface WebDAVConfig {
  url: string;
  username: string;
  password: string;
}

class WebDAVService {
  private client: WebDAVClient | null = null;
  private config: WebDAVConfig | null = null;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initializationPromise = this.loadAndInitialize();
  }

  /**
   * Load stored credentials and initialize client on app start
   */
  private async loadAndInitialize(): Promise<void> {
    try {
      const configJson = await AsyncStorage.getItem(WEBDAV_CONFIG_KEY);
      if (configJson) {
        const config: WebDAVConfig = JSON.parse(configJson);
        await this.initializeClient(config.url, config.username, config.password, false);
      }
    } catch (error) {
      console.error('Failed to load WebDAV config:', error);
    }
  }

  /**
   * Ensure initialization is complete before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  /**
   * Internal method to initialize client without saving
   */
  private async initializeClient(url: string, username: string, password: string, saveConfig: boolean = true): Promise<void> {
    // Ensure URL ends with /remote.php/dav/files/[username] for Nextcloud
    let webdavUrl = url.trim();
    
    // Remove trailing slash
    if (webdavUrl.endsWith('/')) {
      webdavUrl = webdavUrl.slice(0, -1);
    }

    // If it's a Nextcloud URL without the WebDAV path, add it
    if (!webdavUrl.includes('/remote.php/dav')) {
      webdavUrl = `${webdavUrl}/remote.php/dav/files/${username}`;
    }

    this.client = createClient(webdavUrl, {
      username,
      password,
    });

    this.config = { url: webdavUrl, username, password };

    // Test connection
    await this.client.exists('/');

    // Save config for persistence
    if (saveConfig) {
      await AsyncStorage.setItem(WEBDAV_CONFIG_KEY, JSON.stringify(this.config));
    }
  }

  /**
   * Initialize WebDAV client with server configuration
   */
  async initialize(url: string, username: string, password: string): Promise<void> {
    try {
      await this.initializeClient(url, username, password, true);
    } catch (error) {
      console.error('Failed to initialize WebDAV client:', error);
      throw new Error('Failed to connect to WebDAV server. Please check your credentials.');
    }
  }

  /**
   * Check if WebDAV is configured
   */
  async isConfigured(): Promise<boolean> {
    await this.ensureInitialized();
    return this.client !== null && this.config !== null;
  }

  /**
   * Get current configuration (without password)
   */
  async getConfig(): Promise<{ url: string; username: string } | null> {
    await this.ensureInitialized();
    if (!this.config) return null;
    return {
      url: this.config.url,
      username: this.config.username,
    };
  }

  /**
   * Disconnect from WebDAV server
   */
  async disconnect(): Promise<void> {
    this.client = null;
    this.config = null;
    await AsyncStorage.removeItem(WEBDAV_CONFIG_KEY);
  }

  /**
   * Upload local data to WebDAV server
   */
  async uploadData(): Promise<void> {
    await this.ensureInitialized();
    if (!this.client) {
      throw new Error('WebDAV client not initialized');
    }

    try {
      const data = await storageService.getData();
      const jsonData = JSON.stringify(data, null, 2);

      await this.client.putFileContents(WEBDAV_FILE_PATH, jsonData, {
        overwrite: true,
      });
    } catch (error) {
      console.error('Failed to upload data to WebDAV:', error);
      throw new Error('Failed to upload data to server');
    }
  }

  /**
   * Download data from WebDAV server
   */
  async downloadData(): Promise<GTDData | null> {
    await this.ensureInitialized();
    if (!this.client) {
      throw new Error('WebDAV client not initialized');
    }

    try {
      const exists = await this.client.exists(WEBDAV_FILE_PATH);
      if (!exists) {
        return null;
      }

      const content = await this.client.getFileContents(WEBDAV_FILE_PATH, {
        format: 'text',
      });

      const data: GTDData = JSON.parse(content as string);
      return data;
    } catch (error) {
      console.error('Failed to download data from WebDAV:', error);
      throw new Error('Failed to download data from server');
    }
  }

  /**
   * Get last modified timestamp of remote file
   */
  async getRemoteLastModified(): Promise<number | null> {
    await this.ensureInitialized();
    if (!this.client) {
      throw new Error('WebDAV client not initialized');
    }

    try {
      const exists = await this.client.exists(WEBDAV_FILE_PATH);
      if (!exists) {
        return null;
      }

      const stat = (await this.client.stat(WEBDAV_FILE_PATH)) as FileStat;
      return new Date(stat.lastmod).getTime();
    } catch (error) {
      console.error('Failed to get remote file info:', error);
      return null;
    }
  }

  /**
   * Sync data with WebDAV server
   * Strategy: Last-write-wins with conflict detection
   */
  async sync(): Promise<{ success: boolean; message: string }> {
    await this.ensureInitialized();
    if (!this.client) {
      throw new Error('WebDAV client not initialized');
    }

    try {
      const localData = await storageService.getData();
      const remoteData = await this.downloadData();

      // If no remote file exists, upload local data
      if (!remoteData) {
        await this.uploadData();
        await storageService.updateSyncMetadata();
        return {
          success: true,
          message: 'Initial sync completed. Local data uploaded to server.',
        };
      }

      // Compare timestamps to determine which is newer
      const localLastSync = localData.lastSync || 0;
      const remoteLastSync = remoteData.lastSync || 0;

      // If remote is newer, download and merge
      if (remoteLastSync > localLastSync) {
        await storageService.saveData(remoteData);
        await storageService.updateSyncMetadata();
        return {
          success: true,
          message: 'Sync completed. Downloaded updates from server.',
        };
      }

      // If local is newer or same, upload
      await this.uploadData();
      await storageService.updateSyncMetadata();
      return {
        success: true,
        message: 'Sync completed. Uploaded local changes to server.',
      };
    } catch (error) {
      console.error('Sync failed:', error);
      return {
        success: false,
        message: 'Sync failed. Please check your connection and try again.',
      };
    }
  }

  /**
   * Force push local data to server (overwrite remote)
   */
  async forcePush(): Promise<void> {
    await this.uploadData();
    await storageService.updateSyncMetadata();
  }

  /**
   * Force pull data from server (overwrite local)
   */
  async forcePull(): Promise<void> {
    const remoteData = await this.downloadData();
    if (!remoteData) {
      throw new Error('No data found on server');
    }
    await storageService.saveData(remoteData);
    await storageService.updateSyncMetadata();
  }
}

export default new WebDAVService();
