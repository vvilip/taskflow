import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Alert, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Task, Priority, TaskStatus, Project, Tag } from '@/types/gtd';
import { taskService, projectService, tagService } from '@/services';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { parseTaskTitle } from '@/utils/date-parser';
import DateTimePicker from '@react-native-community/datetimepicker';

interface TaskFormProps {
  id?: string;
  onSave?: (task: Partial<Task>) => void;
  onClose?: () => void;
}

export const TaskForm = forwardRef(({ id, onSave, onClose }: TaskFormProps, ref) => {
  const isNew = id === 'new';
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const [task, setTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: undefined,
    priority: undefined,
    dueDate: undefined,
    projectId: undefined,
    tagIds: [],
    completed: false,
  });
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useImperativeHandle(ref, () => ({
    handleSave,
  }));

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
          onClose?.();
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
      return;
    }

    try {
      if (isNew) {
        await taskService.createTask(task);
      } else if (id) {
        await taskService.updateTask(id, task);
      }
      
      onSave?.(task);
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
                onClose?.();
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

  const isDueDateToday = (timestamp: number, daysOffset: number) => {
    const taskDate = new Date(timestamp);
    taskDate.setHours(0, 0, 0, 0);
    const compareDate = new Date();
    compareDate.setDate(compareDate.getDate() + daysOffset);
    compareDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === compareDate.getTime();
  };

  const setDueDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(23, 59, 59, 999);
    const newDate = date.getTime();
    
    if (task.dueDate) {
      const existingDate = new Date(task.dueDate);
      existingDate.setHours(0, 0, 0, 0);
      const compareDate = new Date();
      compareDate.setDate(compareDate.getDate() + days);
      compareDate.setHours(0, 0, 0, 0);
      
      if (existingDate.getTime() === compareDate.getTime()) {
        setTask({ ...task, dueDate: undefined });
        return;
      }
    }
    
    setTask({ ...task, dueDate: newDate });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      selectedDate.setHours(23, 59, 59, 999);
      setTask({ ...task, dueDate: selectedDate.getTime() });
    }
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  const handleTitleChange = (text: string) => {
    const shouldParse = text.endsWith(' ');
    
    if (shouldParse && text.trim()) {
      const parsed = parseTaskTitle(text.trim());
      
      if (parsed.detectedDate) {
        setTask({ 
          ...task, 
          title: '',
          dueDate: parsed.detectedDate,
        });
        return;
      }
    }
    
    setTask({ ...task, title: text });
  };

  return (
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
          onChangeText={handleTitleChange}
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
              onPress={() => setTask({ ...task, priority: task.priority === priority ? undefined : priority })}
            >
              <ThemedText
                style={[
                  styles.priorityText,
                  task.priority === priority && styles.priorityTextActive,
                ]}
              >
                {priority === 'high' ? '🔴 High' : priority === 'medium' ? '🟡 Medium' : '🟢 Low'}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ThemedView>
      </ThemedView>

      <ThemedView style={[styles.section, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.label}>Due Date</ThemedText>
        <ThemedView style={styles.dateContainer}>
          <TouchableOpacity
            style={[
              styles.dateButton, 
              { borderColor: colors.border },
              task.dueDate && isDueDateToday(task.dueDate, 0) && [styles.dateButtonActive, { backgroundColor: colors.tint, borderColor: colors.tint }]
            ]}
            onPress={() => setDueDate(0)}
          >
            <ThemedText style={[
              styles.dateButtonText,
              task.dueDate && isDueDateToday(task.dueDate, 0) && styles.dateButtonTextActive
            ]}>Today</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.dateButton, 
              { borderColor: colors.border },
              task.dueDate && isDueDateToday(task.dueDate, 1) && [styles.dateButtonActive, { backgroundColor: colors.tint, borderColor: colors.tint }]
            ]}
            onPress={() => setDueDate(1)}
          >
            <ThemedText style={[
              styles.dateButtonText,
              task.dueDate && isDueDateToday(task.dueDate, 1) && styles.dateButtonTextActive
            ]}>Tomorrow</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.dateButton, 
              { borderColor: colors.border },
              task.dueDate && isDueDateToday(task.dueDate, 7) && [styles.dateButtonActive, { backgroundColor: colors.tint, borderColor: colors.tint }]
            ]}
            onPress={() => setDueDate(7)}
          >
            <ThemedText style={[
              styles.dateButtonText,
              task.dueDate && isDueDateToday(task.dueDate, 7) && styles.dateButtonTextActive
            ]}>Next Week</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.dateButton, 
              { borderColor: colors.border },
            ]}
            onPress={openDatePicker}
          >
            <ThemedText style={styles.dateButtonText}>📅 Pick Date</ThemedText>
          </TouchableOpacity>
        </ThemedView>
        {task.dueDate && (
          <ThemedView style={styles.selectedDateContainer}>
            <ThemedText style={styles.selectedDate}>
              📅 {formatDate(task.dueDate)}
            </ThemedText>
            <TouchableOpacity onPress={() => setTask({ ...task, dueDate: undefined })}>
              <ThemedText style={[styles.clearDateButton, { color: colors.danger }]}>Clear</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
        {showDatePicker && (
          <DateTimePicker
            value={task.dueDate ? new Date(task.dueDate) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
      </ThemedView>

      <ThemedView style={[styles.section, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.label}>Status</ThemedText>
        <ThemedView style={styles.statusContainer}>
          {(['waiting', 'someday'] as TaskStatus[]).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusButton,
                { borderColor: colors.border },
                task.status === status && [styles.statusButtonActive, { backgroundColor: colors.tint, borderColor: colors.tint }],
              ]}
              onPress={() => setTask({ ...task, status: task.status === status ? undefined : status })}
            >
              <ThemedText
                style={[
                  styles.statusText,
                  task.status === status && styles.statusTextActive,
                ]}
              >
                {status === 'waiting' ? '⏳ Waiting' : '💭 Someday'}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ThemedView>
      </ThemedView>

      <ThemedView style={[styles.section, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.label}>Project</ThemedText>
        <ThemedView style={styles.projectContainer}>
          {projects.map((project) => (
            <TouchableOpacity
              key={project.id}
              style={[
                styles.projectButton,
                { borderColor: colors.border },
                task.projectId === project.id && [styles.projectButtonActive, { backgroundColor: colors.tint, borderColor: colors.tint }],
              ]}
              onPress={() => setTask({ ...task, projectId: task.projectId === project.id ? undefined : project.id })}
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
  );
});

const styles = StyleSheet.create({
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
  dateButtonActive: {
  },
  dateButtonText: {
    fontSize: 14,
  },
  dateButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  selectedDate: {
    fontSize: 14,
    opacity: 0.6,
    flex: 1,
  },
  selectedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  clearDateButton: {
    fontSize: 14,
    fontWeight: '600',
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
