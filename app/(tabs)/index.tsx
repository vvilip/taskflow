import React, { useEffect, useState } from 'react';
import { StyleSheet, Alert, TouchableOpacity, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { TaskList } from '@/components/task-list';
import { FabButton } from '@/components/fab-button';
import { Task } from '@/types/gtd';
import { taskService } from '@/services';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function InboxScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'waiting' | 'someday'>('all');

  useFocusEffect(
    React.useCallback(() => {
      loadTasks();
    }, [statusFilter])
  );

  const loadTasks = async () => {
    try {
      if (statusFilter === 'someday') {
        const allTasks = await taskService.getAllTasks();
        const somedayTasks = allTasks.filter(t => !t.completed && t.status === 'someday');
        setTasks(somedayTasks);
      } else {
        const inboxTasks = await taskService.getInboxTasks();
        const filtered = statusFilter === 'all' 
          ? inboxTasks 
          : inboxTasks.filter(t => t.status === statusFilter);
        setTasks(filtered);
      }
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
    router.push('/modal');
  };

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Inbox</ThemedText>
          <ThemedText style={styles.count}>{tasks.length} tasks</ThemedText>
        </ThemedView>

        <ThemedView style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                { borderColor: colors.border },
                statusFilter === 'all' && [styles.filterButtonActive, { backgroundColor: colors.tint, borderColor: colors.tint }],
              ]}
              onPress={() => setStatusFilter('all')}
            >
              <ThemedText style={[
                styles.filterText,
                statusFilter === 'all' && styles.filterTextActive,
              ]}>All</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                { borderColor: colors.border },
                statusFilter === 'waiting' && [styles.filterButtonActive, { backgroundColor: colors.tint, borderColor: colors.tint }],
              ]}
              onPress={() => setStatusFilter('waiting')}
            >
              <ThemedText style={[
                styles.filterText,
                statusFilter === 'waiting' && styles.filterTextActive,
              ]}>⏳ Waiting</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                { borderColor: colors.border },
                statusFilter === 'someday' && [styles.filterButtonActive, { backgroundColor: colors.tint, borderColor: colors.tint }],
              ]}
              onPress={() => setStatusFilter('someday')}
            >
              <ThemedText style={[
                styles.filterText,
                statusFilter === 'someday' && styles.filterTextActive,
              ]}>💭 Someday</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </ThemedView>
        
        <TaskList
          tasks={tasks}
          onTaskPress={handleTaskPress}
          onToggleComplete={handleToggleComplete}
          emptyMessage="🎉 Inbox is empty!"
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
    paddingBottom: 20,
  },
  count: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 4,
  },
  filterContainer: {
    paddingVertical: 8,
    paddingBottom: 4,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterButtonActive: {
  },
  filterText: {
    fontSize: 14,
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
