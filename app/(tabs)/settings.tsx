import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, Alert, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { storageService, taskService } from '@/services';

export default function SettingsScreen() {
  const [syncing, setSyncing] = useState(false);
  const [autoArchive, setAutoArchive] = useState(false);

  const handleExport = async () => {
    try {
      const fileUri = await storageService.exportToFile();
      Alert.alert(
        'Export Successful',
        `Data exported to:\n${fileUri}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Export Failed', 'Failed to export data');
    }
  };

  const handleClearCompleted = async () => {
    Alert.alert(
      'Archive Completed Tasks',
      'Archive all completed tasks older than 30 days?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              const count = await taskService.archiveOldCompletedTasks(30);
              Alert.alert('Success', `Archived ${count} tasks`);
            } catch (error) {
              Alert.alert('Error', 'Failed to archive tasks');
            }
          },
        },
      ]
    );
  };

  const handleClearAll = async () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all tasks, projects, and tags. This action cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.clearAll();
              Alert.alert('Success', 'All data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert(
        'Sync Coming Soon',
        'WebDAV/Nextcloud sync will be available in a future version'
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Settings</ThemedText>
      </ThemedView>
      
      <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Data</ThemedText>
          
          <TouchableOpacity style={styles.option} onPress={handleExport}>
            <ThemedText style={styles.optionText}>Export Data</ThemedText>
            <ThemedText style={styles.optionDescription}>
              Export all data as JSON file
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={handleClearCompleted}>
            <ThemedText style={styles.optionText}>Archive Completed Tasks</ThemedText>
            <ThemedText style={styles.optionDescription}>
              Remove old completed tasks (30+ days)
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Sync</ThemedText>
          
          <TouchableOpacity 
            style={styles.option} 
            onPress={handleSync}
            disabled={syncing}
          >
            <ThemedText style={styles.optionText}>
              {syncing ? 'Syncing...' : 'Sync Now'}
            </ThemedText>
            <ThemedText style={styles.optionDescription}>
              WebDAV/Nextcloud sync (Coming Soon)
            </ThemedText>
          </TouchableOpacity>

          <ThemedView style={styles.option}>
            <ThemedView style={styles.optionWithSwitch}>
              <ThemedView style={styles.optionTextContainer}>
                <ThemedText style={styles.optionText}>Auto Archive</ThemedText>
                <ThemedText style={styles.optionDescription}>
                  Automatically archive old completed tasks
                </ThemedText>
              </ThemedView>
              <Switch
                value={autoArchive}
                onValueChange={setAutoArchive}
              />
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>About</ThemedText>
          
          <ThemedView style={styles.option}>
            <ThemedText style={styles.optionText}>Version</ThemedText>
            <ThemedText style={styles.optionDescription}>1.0.0</ThemedText>
          </ThemedView>

          <ThemedView style={styles.option}>
            <ThemedText style={styles.optionText}>Storage Format</ThemedText>
            <ThemedText style={styles.optionDescription}>JSON (Human-readable)</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <TouchableOpacity style={styles.dangerOption} onPress={handleClearAll}>
            <ThemedText style={styles.dangerText}>Clear All Data</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  option: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  optionWithSwitch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    opacity: 0.6,
  },
  dangerOption: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
  dangerText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
