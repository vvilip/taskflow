import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Alert, ScrollView, TouchableOpacity, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { TaskList } from '@/components/task-list';
import { Project, Task } from '@/types/gtd';
import { projectService, taskService } from '@/services';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router, useFocusEffect } from 'expo-router';

interface ProjectFormProps {
  id?: string;
  onSave?: (projectId: string) => void;
  onClose?: () => void;
}

export const ProjectForm = forwardRef(({ id, onSave, onClose }: ProjectFormProps, ref) => {
  const isNew = id === 'new';
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  
  const [project, setProject] = useState<Partial<Project>>({
    name: '',
    description: '',
    goal: '',
    color: '#0a7ea4',
    archived: false,
  });
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [isEditing, setIsEditing] = useState(isNew);

  useImperativeHandle(ref, () => ({
    handleSave,
  }));

  useEffect(() => {
    loadData();
  }, [id]);

  useFocusEffect(
    React.useCallback(() => {
      if (!isNew && id) {
        loadData();
      }
    }, [id, isNew])
  );

  const loadData = async () => {
    try {
      if (!isNew && id) {
        const foundProject = await projectService.getProjectById(id);
        if (foundProject) {
          setProject(foundProject);
          const projectTasks = await taskService.getTasksByProject(id);
          setTasks(projectTasks);
        } else {
          Alert.alert('Error', 'Project not found');
          onClose?.();
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!project.name?.trim()) {
      return false;
    }

    try {
      let savedProject: Project | undefined;
      if (isNew) {
        savedProject = await projectService.createProject(project);
      } else if (id) {
        savedProject = await projectService.updateProject(id, project);
        setIsEditing(false);
        await loadData();
      }
      
      return !!savedProject;
    } catch (error) {
      Alert.alert('Error', 'Failed to save project');
      return false;
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? Tasks will be kept but unassigned.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (id && id !== 'new') {
                await projectService.deleteProject(id);
                onClose?.();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete project');
            }
          },
        },
      ]
    );
  };

  const handleArchive = async () => {
    if (!id || id === 'new') return;

    try {
      if (project.archived) {
        await projectService.unarchiveProject(id);
      } else {
        await projectService.archiveProject(id);
      }
      const updatedProject = await projectService.getProjectById(id);
      if (updatedProject) {
        setProject(updatedProject);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to archive project');
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
      
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleTaskPress = (task: Task) => {
    router.push({ pathname: '/modal', params: { taskId: task.id } });
  };

  const handleAddTask = () => {
    router.push({
      pathname: '/modal',
      params: { taskId: 'new', projectId: id },
    });
  };

  const colorOptions = ['#0a7ea4', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#64748b'];

  if (!isNew && !isEditing) {
    return (
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedView style={styles.viewHeader}>
          <View style={styles.projectTitleContainer}>
            {project.color && (
              <View style={[styles.colorIndicator, { backgroundColor: project.color }]} />
            )}
            <ThemedText type="title">{project.name}</ThemedText>
          </View>
          <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.iconButton}>
            <Ionicons name="create-outline" size={24} color={colors.tint} />
          </TouchableOpacity>
        </ThemedView>

        {project.archived && (
          <ThemedView style={styles.archivedBadgeContainer}>
            <View style={[styles.archivedBadge, { backgroundColor: colors.secondaryBackground }]}>
              <ThemedText style={styles.archivedText}>Archived</ThemedText>
            </View>
          </ThemedView>
        )}

        {project.description && (
          <ThemedView style={[styles.section, { borderBottomColor: colors.border }]}>
            <ThemedText style={styles.infoLabel}>Description</ThemedText>
            <ThemedText style={styles.infoText}>{project.description}</ThemedText>
          </ThemedView>
        )}

        {project.goal && (
          <ThemedView style={[styles.section, { borderBottomColor: colors.border }]}>
            <ThemedText style={styles.infoLabel}>Goal</ThemedText>
            <ThemedText style={styles.infoText}>{project.goal}</ThemedText>
          </ThemedView>
        )}

        <ThemedView style={styles.tasksSection}>
          <View style={styles.tasksSectionHeader}>
            <ThemedText type="subtitle">Tasks</ThemedText>
            <TouchableOpacity onPress={handleAddTask} style={styles.iconButton}>
              <Ionicons name="add-circle-outline" size={24} color={colors.tint} />
            </TouchableOpacity>
          </View>
          
          <TaskList
            tasks={tasks}
            onTaskPress={handleTaskPress}
            onToggleComplete={handleToggleComplete}
            emptyMessage="No tasks in this project yet"
            scrollable={false}
          />
        </ThemedView>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollViewContent}
      showsVerticalScrollIndicator={true}
      scrollEnabled={true}
      nestedScrollEnabled={true}
      keyboardShouldPersistTaps="handled"
    >
      <ThemedView style={[styles.section, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.label}>Project Name *</ThemedText>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.inputBackground, 
            borderColor: colors.inputBorder,
            color: colors.text
          }]}
          value={project.name}
          onChangeText={(text) => setProject({ ...project, name: text })}
          placeholder="Enter project name"
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
          value={project.description}
          onChangeText={(text) => setProject({ ...project, description: text })}
          placeholder="Add description"
          placeholderTextColor={colors.placeholder}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </ThemedView>

      <ThemedView style={[styles.section, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.label}>Goal</ThemedText>
        <TextInput
          style={[styles.input, styles.textArea, { 
            backgroundColor: colors.inputBackground, 
            borderColor: colors.inputBorder,
            color: colors.text
          }]}
          value={project.goal}
          onChangeText={(text) => setProject({ ...project, goal: text })}
          placeholder="What's the desired outcome?"
          placeholderTextColor={colors.placeholder}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </ThemedView>

      <ThemedView style={[styles.section, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.label}>Color</ThemedText>
        <View style={styles.colorContainer}>
          {colorOptions.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorButton,
                { backgroundColor: color },
                project.color === color && styles.colorButtonActive,
              ]}
              onPress={() => setProject({ ...project, color })}
            />
          ))}
        </View>
      </ThemedView>

      {!isNew && (
        <>
          <ThemedView style={[styles.section, { borderBottomColor: colors.border }]}>
            <TouchableOpacity 
              style={[styles.archiveButton, { backgroundColor: colors.secondaryBackground }]} 
              onPress={handleArchive}
            >
              <ThemedText style={styles.archiveButtonText}>
                {project.archived ? 'Unarchive Project' : 'Archive Project'}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>

          <ThemedView style={[styles.section, { borderBottomColor: colors.border }]}>
            <TouchableOpacity 
              style={[styles.deleteButton, { backgroundColor: colors.dangerBackground }]} 
              onPress={handleDelete}
            >
              <ThemedText style={[styles.deleteButtonText, { color: colors.danger }]}>
                Delete Project
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </>
      )}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 120,
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
    minHeight: 80,
    paddingTop: 12,
  },
  colorContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorButtonActive: {
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  archiveButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  archiveButtonText: {
    fontSize: 16,
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
  viewHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  colorIndicator: {
    width: 6,
    height: 32,
    borderRadius: 3,
  },
  iconButton: {
    padding: 4,
  },
  archivedBadgeContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  archivedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  archivedText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoText: {
    fontSize: 16,
    lineHeight: 22,
  },
  tasksSection: {
    paddingTop: 8,
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});
