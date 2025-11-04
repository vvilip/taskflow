import React, { useEffect, useState } from 'react';
import { StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { TaskList } from '@/components/task-list';
import { FabButton } from '@/components/fab-button';
import { Task } from '@/types/gtd';
import { taskService } from '@/services';

export default function TodayScreen() {
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadTasks();
    }, [])
  );

  const loadTasks = async () => {
    try {
      const today = await taskService.getTodayTasks();
      setTodayTasks(today);
    } catch (error) {
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (taskId: string) => {
    try {
      const task = todayTasks.find(t => t.id === taskId);
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
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    router.push({
      pathname: '/task/new',
      params: { dueDate: today.getTime().toString() },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
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
        
        <TaskList
          tasks={todayTasks}
          onTaskPress={handleTaskPress}
          onToggleComplete={handleToggleComplete}
          emptyMessage="☀️ No tasks for today!"
        />
        
        <FabButton onPress={handleAddTask} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
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
});
