import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Task } from '@/types/gtd';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface TaskItemProps {
  task: Task;
  onPress: () => void;
  onToggleComplete: () => void;
}

export function TaskItem({ task, onPress, onToggleComplete }: TaskItemProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const priorityColor = task.priority === 'high' ? '#ef4444' : 
                       task.priority === 'medium' ? '#f59e0b' : 
                       colors.subtitle;

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date >= today && date < tomorrow) return 'Today';
    if (date >= tomorrow && date < new Date(tomorrow.getTime() + 86400000)) return 'Tomorrow';
    if (date < today) return '⚠️ Overdue';
    
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity 
        style={[
          styles.checkbox, 
          { borderColor: colors.placeholder },
          task.completed && [styles.checkboxCompleted, { backgroundColor: colors.tint }]
        ]}
        onPress={onToggleComplete}
      >
        {task.completed && <ThemedText style={styles.checkmark}>✓</ThemedText>}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.content} onPress={onPress}>
        <View style={styles.header}>
          {task.priority && (
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]} />
          )}
          <ThemedText 
            style={[
              styles.title,
              task.completed && styles.completedText
            ]}
            numberOfLines={1}
          >
            {task.title}
          </ThemedText>
        </View>
        
        {(task.description || task.dueDate) && (
          <View style={styles.meta}>
            {task.description && (
              <ThemedText style={styles.description} numberOfLines={1}>
                {task.description}
              </ThemedText>
            )}
            {task.dueDate && (
              <ThemedText style={[styles.dueDate, task.dueDate < Date.now() && styles.overdue]}>
                {formatDate(task.dueDate)}
              </ThemedText>
            )}
          </View>
        )}
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxCompleted: {
    borderWidth: 0,
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontSize: 16,
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  meta: {
    marginTop: 4,
    gap: 4,
  },
  description: {
    fontSize: 14,
    opacity: 0.7,
  },
  dueDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  overdue: {
    color: '#ef4444',
    fontWeight: '600',
  },
});
