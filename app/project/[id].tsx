import React, { useEffect, useState } from 'react';
import { StyleSheet, Alert, ScrollView, TouchableOpacity, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { TaskList } from '@/components/task-list';
import { Project, Task } from '@/types/gtd';
import { projectService, taskService } from '@/services';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  
  const [project, setProject] = useState<Partial<Project>>({
    name: '',
    description: '',
    goal: '',
    color: '#0a7ea4',
    archived: false,
  });
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isEditing, setIsEditing] = useState(isNew);
  const [loading, setLoading] = useState(!isNew);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [id])
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
          router.back();
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
      Alert.alert('Error', 'Please enter a project name');
      return;
    }

    try {
      if (isNew) {
        await projectService.createProject(project);
        router.back();
      } else if (id) {
        await projectService.updateProject(id, project);
        setIsEditing(false);
        await loadData();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save project');
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
                router.back();
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
      await loadData();
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
    router.push(`/task/${task.id}`);
  };

  const handleAddTask = () => {
    router.push({
      pathname: '/task/new',
      params: { projectId: id },
    });
  };

  const colors = ['#0a7ea4', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#64748b'];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ThemedText style={styles.backButton}>Back</ThemedText>
          </TouchableOpacity>
          {isEditing ? (
            <TouchableOpacity onPress={handleSave}>
              <ThemedText style={styles.saveButton}>Save</ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <ThemedText style={styles.editButton}>Edit</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.scrollView}>
        {isEditing ? (
          <>
            <View style={styles.section}>
              <ThemedText style={styles.label}>Project Name *</ThemedText>
              <TextInput
                style={styles.input}
                value={project.name}
                onChangeText={(text) => setProject({ ...project, name: text })}
                placeholder="Enter project name"
                placeholderTextColor="#94a3b8"
                autoFocus={isNew}
              />
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.label}>Description</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={project.description}
                onChangeText={(text) => setProject({ ...project, description: text })}
                placeholder="Add description"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.label}>Goal</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={project.goal}
                onChangeText={(text) => setProject({ ...project, goal: text })}
                placeholder="What's the desired outcome?"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.label}>Color</ThemedText>
              <View style={styles.colorContainer}>
                {colors.map((color) => (
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
            </View>

            {!isNew && (
              <View style={styles.section}>
                <TouchableOpacity style={styles.archiveButton} onPress={handleArchive}>
                  <ThemedText style={styles.archiveButtonText}>
                    {project.archived ? 'Unarchive Project' : 'Archive Project'}
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                  <ThemedText style={styles.deleteButtonText}>Delete Project</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.projectHeader}>
              <View style={styles.projectTitleContainer}>
                {project.color && (
                  <View style={[styles.colorIndicator, { backgroundColor: project.color }]} />
                )}
                <ThemedText type="title">{project.name}</ThemedText>
              </View>
              {project.archived && (
                <View style={styles.archivedBadge}>
                  <ThemedText style={styles.archivedText}>Archived</ThemedText>
                </View>
              )}
            </View>

            {project.description && (
              <View style={styles.infoSection}>
                <ThemedText style={styles.infoLabel}>Description</ThemedText>
                <ThemedText style={styles.infoText}>{project.description}</ThemedText>
              </View>
            )}

            {project.goal && (
              <View style={styles.infoSection}>
                <ThemedText style={styles.infoLabel}>Goal</ThemedText>
                <ThemedText style={styles.infoText}>{project.goal}</ThemedText>
              </View>
            )}

            <View style={styles.tasksSection}>
              <View style={styles.tasksSectionHeader}>
                <ThemedText type="subtitle">Tasks</ThemedText>
                <TouchableOpacity onPress={handleAddTask}>
                  <ThemedText style={styles.addTaskButton}>+ Add Task</ThemedText>
                </TouchableOpacity>
              </View>
              
              <TaskList
                tasks={tasks}
                onTaskPress={handleTaskPress}
                onToggleComplete={handleToggleComplete}
                emptyMessage="No tasks in this project yet"
                scrollable={false}
              />
            </View>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    color: '#0a7ea4',
  },
  editButton: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
  saveButton: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    backgroundColor: 'transparent',
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
    borderColor: '#e2e8f0',
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
    backgroundColor: 'transparent',
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
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    marginBottom: 12,
  },
  archiveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  projectHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  projectTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'transparent',
  },
  colorIndicator: {
    width: 6,
    height: 32,
    borderRadius: 3,
  },
  archivedBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  archivedText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
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
    marginTop: 24,
    backgroundColor: 'transparent',
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  addTaskButton: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
    backgroundColor: 'transparent',
  },
});
