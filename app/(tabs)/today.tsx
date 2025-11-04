import React, { useEffect, useState } from 'react';
import { StyleSheet, SafeAreaView, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { TaskList } from '@/components/task-list';
import { FabButton } from '@/components/fab-button';
import { Task } from '@/types/gtd';
import { taskService } from '@/services';

export default function TodayScreen() {
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [tomorrowTasks, setTomorrowTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const [today, tomorrow, overdue] = await Promise.all([
        taskService.getTodayTasks(),
        taskService.getTomorrowTasks(),
        taskService.getOverdueTasks(),
      ]);
      
      setTodayTasks(today);
      setTomorrowTasks(tomorrow);
      setOverdueTasks(overdue);
    } catch (error) {
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (taskId: string) => {
    try {
      const allTasks = [...overdueTasks, ...todayTasks, ...tomorrowTasks];
      const task = allTasks.find(t => t.id === taskId);
      if (!task) return;

      if (task.completed) {
        await taskService.uncompleteTask(taskId);
      } else {
        await taskService.completeTask(taskId);
      }
      
      await loadTasks();
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleTaskPress = (task: Task) => {
    router.push(`/task/${task.id}`);
  };

  const handleAddTask = () => {
    router.push('/task/new');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Today</ThemedText>
        <ThemedText style={styles.date}>
          {new Date().toLocaleDateString('de-DE', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
          })}
        </ThemedText>
      </ThemedView>
      
      <ScrollView style={styles.scrollView}>
        {overdueTasks.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle" style={styles.overdueTitle}>⚠️ Overdue</ThemedText>
            <TaskList
              tasks={overdueTasks}
              onTaskPress={handleTaskPress}
              onToggleComplete={handleToggleComplete}
            />
          </ThemedView>
        )}

        {todayTasks.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Today</ThemedText>
            <TaskList
              tasks={todayTasks}
              onTaskPress={handleTaskPress}
              onToggleComplete={handleToggleComplete}
            />
          </ThemedView>
        )}

        {tomorrowTasks.length > 0 && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Tomorrow</ThemedText>
            <TaskList
              tasks={tomorrowTasks}
              onTaskPress={handleTaskPress}
              onToggleComplete={handleToggleComplete}
            />
          </ThemedView>
        )}

        {overdueTasks.length === 0 && todayTasks.length === 0 && tomorrowTasks.length === 0 && (
          <ThemedView style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              ☀️ All clear! No scheduled tasks.
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>
      
      <FabButton onPress={handleAddTask} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  date: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  overdueTitle: {
    color: '#ef4444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.5,
    textAlign: 'center',
  },
});
