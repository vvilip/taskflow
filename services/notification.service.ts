/**
 * Notification Service
 * Handles daily task notifications
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NotificationRequest } from 'expo-notifications';
import taskService from './task.service';
import {
  DEFAULT_REMINDER_TIME,
  ReminderTime,
  buildReminderBody,
  isValidReminderTime,
} from '../utils/reminder';

const REMINDER_TIME_KEY = '@taskflow_reminder_time';

// Only import notifications on native platforms
let Notifications: any;
if (Platform.OS !== 'web') {
  Notifications = require('expo-notifications');
  
  // Configure notification behavior
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

class NotificationService {
  private notificationId: string | null = null;

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permission not granted');
        return false;
      }

      // For Android, create notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('daily-tasks', {
          name: 'Daily Task Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  /**
   * Get the configured daily reminder time (falls back to the default).
   */
  async getReminderTime(): Promise<ReminderTime> {
    try {
      const json = await AsyncStorage.getItem(REMINDER_TIME_KEY);
      if (json) {
        const parsed = JSON.parse(json) as ReminderTime;
        if (isValidReminderTime(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Failed to load reminder time:', error);
    }
    return DEFAULT_REMINDER_TIME;
  }

  /**
   * Persist a new reminder time. If a daily reminder is currently scheduled,
   * it is rescheduled at the new time.
   */
  async setReminderTime(time: ReminderTime): Promise<void> {
    if (!isValidReminderTime(time)) {
      throw new Error('Invalid reminder time');
    }
    await AsyncStorage.setItem(REMINDER_TIME_KEY, JSON.stringify(time));
    if (Platform.OS !== 'web') {
      const scheduled = await this.getScheduledNotifications();
      if (scheduled.length > 0) {
        await this.scheduleDailyNotificationWithCount();
      }
    }
  }

  /**
   * Schedule the daily reminder at the configured time, with a body that
   * reflects how many tasks are scheduled for today.
   */
  async scheduleDailyNotificationWithCount(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return false;
      }

      // Cancel any previously scheduled reminder. We cancel all (rather than
      // by id) so duplicates can't pile up across app restarts, where the
      // in-memory notificationId is lost.
      await Notifications.cancelAllScheduledNotificationsAsync();

      const todayTasks = await taskService.getTodayTasks();
      const body = buildReminderBody(todayTasks.length);
      const { hour, minute } = await this.getReminderTime();

      this.notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📋 Daily Task Reminder',
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { screen: '/(tabs)/today' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          repeats: true,
        } as any,
      });

      return true;
    } catch (error) {
      console.error('Failed to schedule notification with count:', error);
      return false;
    }
  }

  /**
   * Re-schedule the daily reminder if one is already active, so the task
   * count and configured time stay current. Safe to call on app start.
   */
  async refreshDailyNotificationIfEnabled(): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }
    try {
      const scheduled = await this.getScheduledNotifications();
      if (scheduled.length > 0) {
        await this.scheduleDailyNotificationWithCount();
      }
    } catch (error) {
      console.error('Failed to refresh daily notification:', error);
    }
  }

  /**
   * Cancel the daily reminder.
   */
  async cancelDailyNotification(): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.notificationId = null;
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  /**
   * Check if notifications are enabled
   */
  async isEnabled(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.notificationId = null;
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  /**
   * Send immediate test notification
   */
  async sendTestNotification(): Promise<void> {
    try {
      const todayTasks = await taskService.getTodayTasks();
      const body = buildReminderBody(todayTasks.length);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📋 Daily Task Reminder (Test)',
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { screen: '/(tabs)/today' },
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  }
}

export default new NotificationService();
