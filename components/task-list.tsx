import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Task } from '@/types/gtd';
import { TaskItem } from './task-item';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface TaskListProps {
  tasks: Task[];
  onTaskPress: (task: Task) => void;
  onToggleComplete: (taskId: string) => void;
  emptyMessage?: string;
  scrollable?: boolean;
}

export function TaskList({ tasks, onTaskPress, onToggleComplete, emptyMessage, scrollable = true }: TaskListProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (tasks.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>
          {emptyMessage || 'No tasks'}
        </ThemedText>
      </ThemedView>
    );
  }

  if (!scrollable) {
    return (
      <ThemedView style={styles.list}>
        {tasks.map((item, index) => (
          <React.Fragment key={item.id}>
            <TaskItem
              task={item}
              onPress={() => onTaskPress(item)}
              onToggleComplete={() => onToggleComplete(item.id)}
            />
            {index < tasks.length - 1 && <View style={[styles.separator, { backgroundColor: colors.border }]} />}
          </React.Fragment>
        ))}
      </ThemedView>
    );
  }

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TaskItem
          task={item}
          onPress={() => onTaskPress(item)}
          onToggleComplete={() => onToggleComplete(item.id)}
        />
      )}
      ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
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
  },
});
