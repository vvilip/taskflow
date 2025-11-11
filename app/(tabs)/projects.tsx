import React, { useEffect, useState } from 'react';
import { StyleSheet, Alert, TouchableOpacity, FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { FabButton } from '@/components/fab-button';
import { Project } from '@/types/gtd';
import { projectService, taskService } from '@/services';

export default function ProjectsScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadProjects();
    }, [])
  );

  const loadProjects = async () => {
    try {
      const allProjects = await projectService.getAllProjects();
      setProjects(allProjects);
      
      const counts: Record<string, number> = {};
      for (const project of allProjects) {
        counts[project.id] = await projectService.getProjectTaskCount(project.id);
      }
      setTaskCounts(counts);
    } catch (error) {
      Alert.alert('Error', 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectPress = (project: Project) => {
    router.push({ pathname: '/project-modal', params: { projectId: project.id } });
  };

  const handleAddProject = () => {
    router.push({ pathname: '/project-modal', params: { projectId: 'new' } });
  };

  const renderProject = ({ item }: { item: Project }) => (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => handleProjectPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.projectContent}>
        {item.color && (
          <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
        )}
        <View style={styles.projectInfo}>
          <ThemedText type="defaultSemiBold" style={styles.projectName}>
            {item.name}
          </ThemedText>
          {item.description && (
            <ThemedText style={styles.projectDescription} numberOfLines={2}>
              {item.description}
            </ThemedText>
          )}
          <ThemedText style={styles.taskCount}>
            {taskCounts[item.id] || 0} tasks
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <ThemedText type="title">Projects</ThemedText>
          <ThemedText style={styles.count}>{projects.length} projects</ThemedText>
        </View>
        
        {projects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              📁 No projects yet
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Create a project to organize your tasks
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={projects}
            keyExtractor={(item) => item.id}
            renderItem={renderProject}
            contentContainerStyle={styles.list}
          />
        )}
        
        <FabButton onPress={handleAddProject} />
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
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  projectCard: {
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  projectContent: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  colorIndicator: {
    width: 6,
    borderRadius: 3,
  },
  projectInfo: {
    flex: 1,
    gap: 4,
  },
  projectName: {
    fontSize: 18,
  },
  projectDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  taskCount: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.5,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.4,
    textAlign: 'center',
    marginTop: 8,
  },
});
