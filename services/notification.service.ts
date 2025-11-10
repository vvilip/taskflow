/**
 * Notification Service
 * Handles daily task notifications
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import taskService from './task.service';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  } as Notifications.NotificationBehavior),
});

class NotificationService {
  private notificationId: string | null = null;

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
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
   * Schedule daily notification at noon
   */
  async scheduleDailyNotification(): Promise<boolean> {
    try {
      // Cancel existing notification if any
      if (this.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(this.notificationId);
      }

      // Schedule notification for noon every day
      this.notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Daily Task Reminder',
          body: 'Check your tasks for today',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 12,
          minute: 0,
          repeats: true,
        } as any,
      });

      console.log('Daily notification scheduled:', this.notificationId);
      return true;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      return false;
    }
  }

  /**
   * Schedule notification with task count
   */
  async scheduleDailyNotificationWithCount(): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return false;
      }

      // Cancel existing notification if any
      if (this.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(this.notificationId);
      }

      // Get today's task count
      const todayTasks = await taskService.getTodayTasks();
      const taskCount = todayTasks.length;

      let body = 'Check your tasks for today';
      if (taskCount > 0) {
        body = `You have ${taskCount} task${taskCount > 1 ? 's' : ''} scheduled for today`;
      }

      // Schedule notification for noon every day
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
          hour: 12,
          minute: 0,
          repeats: true,
        } as any,
      });

      console.log('Daily notification scheduled with count:', this.notificationId);
      return true;
    } catch (error) {
      console.error('Failed to schedule notification with count:', error);
      return false;
    }
  }

  /**
   * Cancel daily notification
   */
  async cancelDailyNotification(): Promise<void> {
    try {
      if (this.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(this.notificationId);
        this.notificationId = null;
        console.log('Daily notification cancelled');
      }
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  /**
   * Check if notifications are enabled
   */
  async isEnabled(): Promise<boolean> {
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
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
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
      const taskCount = todayTasks.length;

      let body = 'No tasks scheduled for today';
      if (taskCount > 0) {
        body = `You have ${taskCount} task${taskCount > 1 ? 's' : ''} scheduled for today`;
      }

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
