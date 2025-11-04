import React, { useEffect, useState } from 'react';
import { StyleSheet, SafeAreaView, Alert } from 'react-native';
import { router } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { TaskList } from '@/components/task-list';
import { FabButton } from '@/components/fab-button';
import { Task } from '@/types/gtd';
import { taskService } from '@/services';

export default function InboxScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const inboxTasks = await taskService.getInboxTasks();
      setTasks(inboxTasks);
    } catch (error) {
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
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
        <ThemedText type="title">Inbox</ThemedText>
        <ThemedText style={styles.count}>{tasks.length} tasks</ThemedText>
      </ThemedView>
      
      <TaskList
        tasks={tasks}
        onTaskPress={handleTaskPress}
        onToggleComplete={handleToggleComplete}
        emptyMessage="🎉 Inbox is empty!"
      />
      
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
  count: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 4,
  },
});
