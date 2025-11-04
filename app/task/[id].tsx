import React, { useEffect, useState } from 'react';
import { StyleSheet, SafeAreaView, Alert, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Task, Priority, TaskStatus, Project, Tag } from '@/types/gtd';
import { taskService, projectService, tagService } from '@/services';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TaskDetailScreen() {
  const { id, dueDate: dueDateParam, projectId: projectIdParam } = useLocalSearchParams<{ 
    id: string;
    dueDate?: string;
    projectId?: string;
  }>();
  const isNew = id === 'new';
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const [task, setTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'inbox',
    priority: undefined,
    dueDate: dueDateParam ? parseInt(dueDateParam) : undefined,
    projectId: projectIdParam,
    tagIds: [],
    completed: false,
  });
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [allProjects, allTags] = await Promise.all([
        projectService.getAllProjects(),
        tagService.getAllTags(),
      ]);
      
      setProjects(allProjects);
      setTags(allTags);

      if (!isNew && id) {
        const tasks = await taskService.getAllTasks();
        const foundTask = tasks.find(t => t.id === id);
        if (foundTask) {
          setTask(foundTask);
        } else {
          Alert.alert('Error', 'Task not found');
          router.back();
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!task.title?.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    try {
      if (isNew) {
        await taskService.createTask(task);
      } else if (id) {
        await taskService.updateTask(id, task);
      }
      
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save task');
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (id && id !== 'new') {
                await taskService.deleteTask(id);
                router.back();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'No date';
    return new Date(timestamp).toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const setDueDate = (days: number | null) => {
    if (days === null) {
      setTask({ ...task, dueDate: undefined });
    } else {
      const date = new Date();
      date.setDate(date.getDate() + days);
      date.setHours(23, 59, 59, 999);
      setTask({ ...task, dueDate: date.getTime() });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText style={[styles.cancelButton, { color: colors.subtitle }]}>Cancel</ThemedText>
        </TouchableOpacity>
        <ThemedText type="defaultSemiBold">{isNew ? 'New Task' : 'Edit Task'}</ThemedText>
        <TouchableOpacity onPress={handleSave}>
          <ThemedText style={[styles.saveButton, { color: colors.tint }]}>Save</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ScrollView style={styles.scrollView}>
        <ThemedView style={[styles.section, { borderBottomColor: colors.border }]}>
          <ThemedText style={styles.label}>Title *</ThemedText>
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.inputBackground, 
              borderColor: colors.inputBorder,
              color: colors.text
            }]}
            value={task.title}
            onChangeText={(text) => setTask({ ...task, title: text })}
            placeholder="Enter task title"
            placeholderTextColor={colors.placeholder}
            autoFocus={isNew}
          />
        </ThemedView>

        <ThemedView style={[styles.section, { borderBottomColor: colors.border }]}>
          <ThemedText style={styles.label}>Description</ThemedText>
          <TextInput
            style={[styles.input, styles.textArea, { 
              backgroundColor: colors.inputBackground, 
              borderColor: colors.inputBorder,
              color: colors.text
            }]}
            value={task.description}
            onChangeText={(text) => setTask({ ...task, description: text })}
            placeholder="Add description"
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </ThemedView>

        <ThemedView style={[styles.section, { borderBottomColor: colors.border }]}>
          <ThemedText style={styles.label}>Priority</ThemedText>
          <ThemedView style={styles.priorityContainer}>
            {(['high', 'medium', 'low'] as Priority[]).map((priority) => (
              <TouchableOpacity
                key={priority}
                style={[
                  styles.priorityButton,
                  { borderColor: colors.border },
                  task.priority === priority && [styles.priorityButtonActive, { backgroundColor: colors.tint, borderColor: colors.tint }],
                ]}
                onPress={() => setTask({ ...task, priority })}
              >
                <ThemedText
                  style={[
                    styles.priorityText,
                    task.priority === priority && styles.priorityTextActive,
                  ]}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.priorityButton, { borderColor: colors.border }]}
              onPress={() => setTask({ ...task, priority: undefined })}
            >
              <ThemedText style={styles.priorityText}>None</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>

        <ThemedView style={[styles.section, { borderBottomColor: colors.border }]}>
          <ThemedText style={styles.label}>Due Date</ThemedText>
          <ThemedView style={styles.dateContainer}>
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: colors.border }]}
              onPress={() => setDueDate(0)}
            >
              <ThemedText style={styles.dateButtonText}>Today</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: colors.border }]}
              onPress={() => setDueDate(1)}
            >
              <ThemedText style={styles.dateButtonText}>Tomorrow</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: colors.border }]}
              onPress={() => setDueDate(7)}
            >
              <ThemedText style={styles.dateButtonText}>Next Week</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateButton, { borderColor: colors.border }]}
              onPress={() => setDueDate(null)}
            >
              <ThemedText style={styles.dateButtonText}>Clear</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          {task.dueDate && (
            <ThemedText style={styles.selectedDate}>
              {formatDate(task.dueDate)}
            </ThemedText>
          )}
        </ThemedView>

        <ThemedView style={[styles.section, { borderBottomColor: colors.border }]}>
          <ThemedText style={styles.label}>Status</ThemedText>
          <ThemedView style={styles.statusContainer}>
            {(['inbox', 'next', 'waiting', 'someday'] as TaskStatus[]).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusButton,
                  { borderColor: colors.border },
                  task.status === status && [styles.statusButtonActive, { backgroundColor: colors.tint, borderColor: colors.tint }],
                ]}
                onPress={() => setTask({ ...task, status })}
              >
                <ThemedText
                  style={[
                    styles.statusText,
                    task.status === status && styles.statusTextActive,
                  ]}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
        </ThemedView>

        <ThemedView style={[styles.section, { borderBottomColor: colors.border }]}>
          <ThemedText style={styles.label}>Project</ThemedText>
          <ThemedView style={styles.projectContainer}>
            <TouchableOpacity
              style={[
                styles.projectButton,
                { borderColor: colors.border },
                !task.projectId && [styles.projectButtonActive, { backgroundColor: colors.tint, borderColor: colors.tint }],
              ]}
              onPress={() => setTask({ ...task, projectId: undefined })}
            >
              <ThemedText style={[styles.projectText, !task.projectId && styles.projectTextActive]}>None</ThemedText>
            </TouchableOpacity>
            {projects.map((project) => (
              <TouchableOpacity
                key={project.id}
                style={[
                  styles.projectButton,
                  { borderColor: colors.border },
                  task.projectId === project.id && [styles.projectButtonActive, { backgroundColor: colors.tint, borderColor: colors.tint }],
                ]}
                onPress={() => setTask({ ...task, projectId: project.id })}
              >
                <ThemedText style={[styles.projectText, task.projectId === project.id && styles.projectTextActive]}>{project.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
        </ThemedView>

        {!isNew && (
          <ThemedView style={[styles.section, { borderBottomColor: colors.border }]}>
            <TouchableOpacity style={[styles.deleteButton, { backgroundColor: colors.dangerBackground }]} onPress={handleDelete}>
              <ThemedText style={[styles.deleteButtonText, { color: colors.danger }]}>Delete Task</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}

        <ThemedView style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancelButton: {
    fontWeight: '400',
  },
  saveButton: {
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.7,
  },
  input: {
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 44,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  priorityButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  priorityButtonActive: {
  },
  priorityText: {
    fontSize: 14,
  },
  priorityTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  dateButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: 14,
  },
  selectedDate: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.6,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusButtonActive: {
  },
  statusText: {
    fontSize: 14,
  },
  statusTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  projectContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  projectButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  projectButtonActive: {
  },
  projectText: {
    fontSize: 14,
  },
  projectTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  deleteButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});
