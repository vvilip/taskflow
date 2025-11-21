import React, { useState } from 'react';
import { StyleSheet, Alert, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { storageService, taskService, webdavService } from '@/services';
import { useTheme } from '@/contexts/theme-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SettingsScreen() {
  const [syncing, setSyncing] = useState(false);
  const [autoArchive, setAutoArchive] = useState(false);
  const [webdavConfigured, setWebdavConfigured] = useState(false);
  const [webdavInfo, setWebdavInfo] = useState<{ url: string; username: string } | null>(null);
  const { themeMode, setThemeMode } = useTheme();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  useFocusEffect(
    React.useCallback(() => {
      checkWebDAVStatus();
    }, [])
  );

  const checkWebDAVStatus = async () => {
    const isConfigured = await webdavService.isConfigured();
    setWebdavConfigured(isConfigured);
    if (isConfigured) {
      const config = await webdavService.getConfig();
      setWebdavInfo(config);
    }
  };



  const handleExport = async () => {
    try {
      await storageService.exportToFile();
      Alert.alert(
        'Export Successful',
        'Your data has been exported as JSON. You can now save or share the file.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Export Failed', 'Failed to export data. Please try again.');
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      Alert.alert(
        'Import Data',
        'This will replace all existing data. Do you want to continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            style: 'destructive',
            onPress: async () => {
              try {
                await storageService.importFromFile(result.assets[0].uri);
                Alert.alert(
                  'Import Successful',
                  'Your data has been imported successfully.',
                  [
                    { 
                      text: 'OK',
                      onPress: () => {
                        // Navigate to inbox to trigger reload
                        router.replace('/(tabs)');
                      }
                    }
                  ]
                );
              } catch (error) {
                Alert.alert(
                  'Import Failed',
                  'Failed to import data. Please make sure the file is a valid Taskflow export.',
                  [{ text: 'OK' }]
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Import Failed', 'Failed to select file. Please try again.');
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
    if (!webdavConfigured) {
      Alert.alert(
        'WebDAV Not Configured',
        'Please configure your WebDAV/Nextcloud connection first.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Configure', onPress: () => router.push('/webdav-setup') },
        ]
      );
      return;
    }

    setSyncing(true);
    try {
      const result = await webdavService.sync();
      Alert.alert(
        result.success ? 'Sync Complete' : 'Sync Failed',
        result.message
      );
    } catch (error) {
      Alert.alert('Sync Failed', 'An error occurred during sync');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectWebDAV = () => {
    Alert.alert(
      'Disconnect WebDAV',
      'This will remove your WebDAV connection. Your local data will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await webdavService.disconnect();
            await checkWebDAVStatus();
            Alert.alert('Disconnected', 'WebDAV connection removed');
          },
        },
      ]
    );
  };



  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Settings</ThemedText>
        </ThemedView>
        
        <ScrollView style={styles.scrollView}>
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Appearance</ThemedText>
          
          <ThemedView style={[styles.option, { borderBottomColor: colors.border }]}>
            <ThemedText style={styles.optionText}>Theme</ThemedText>
            <ThemedView style={styles.themeOptions}>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  { borderColor: colors.border },
                  themeMode === 'light' && [styles.themeButtonActive, { backgroundColor: colors.tint, borderColor: colors.tint }],
                ]}
                onPress={() => setThemeMode('light')}
              >
                <ThemedText style={[
                  styles.themeButtonText,
                  themeMode === 'light' && styles.themeButtonTextActive,
                ]}>☀️ Light</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  { borderColor: colors.border },
                  themeMode === 'dark' && [styles.themeButtonActive, { backgroundColor: colors.tint, borderColor: colors.tint }],
                ]}
                onPress={() => setThemeMode('dark')}
              >
                <ThemedText style={[
                  styles.themeButtonText,
                  themeMode === 'dark' && styles.themeButtonTextActive,
                ]}>🌙 Dark</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  { borderColor: colors.border },
                  themeMode === 'system' && [styles.themeButtonActive, { backgroundColor: colors.tint, borderColor: colors.tint }],
                ]}
                onPress={() => setThemeMode('system')}
              >
                <ThemedText style={[
                  styles.themeButtonText,
                  themeMode === 'system' && styles.themeButtonTextActive,
                ]}>⚙️ System</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Data</ThemedText>
          
          <TouchableOpacity style={[styles.option, { borderBottomColor: colors.border }]} onPress={handleExport}>
            <ThemedText style={styles.optionText}>Export Data</ThemedText>
            <ThemedText style={styles.optionDescription}>
              Export all data as JSON file
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.option, { borderBottomColor: colors.border }]} onPress={handleImport}>
            <ThemedText style={styles.optionText}>Import Data</ThemedText>
            <ThemedText style={styles.optionDescription}>
              Import data from JSON file
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.option, { borderBottomColor: colors.border }]} 
            onPress={() => router.push('/archive')}
          >
            <ThemedText style={styles.optionText}>View Archive</ThemedText>
            <ThemedText style={styles.optionDescription}>
              View all completed tasks
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.option, { borderBottomColor: colors.border }]} onPress={handleClearCompleted}>
            <ThemedText style={styles.optionText}>Archive Completed Tasks</ThemedText>
            <ThemedText style={styles.optionDescription}>
              Remove old completed tasks (30+ days)
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Sync</ThemedText>
          
          {!webdavConfigured ? (
            <TouchableOpacity 
              style={[styles.option, { borderBottomColor: colors.border }]} 
              onPress={() => router.push('/webdav-setup')}
            >
              <ThemedText style={styles.optionText}>Configure WebDAV / Nextcloud</ThemedText>
              <ThemedText style={styles.optionDescription}>
                Set up sync with your server
              </ThemedText>
            </TouchableOpacity>
          ) : (
            <>
              <ThemedView style={[styles.option, { borderBottomColor: colors.border }]}>
                <ThemedText style={styles.optionText}>WebDAV Connected</ThemedText>
                <ThemedText style={styles.optionDescription}>
                  {webdavInfo?.username}@{webdavInfo?.url.replace(/^https?:\/\//, '').split('/')[0]}
                </ThemedText>
              </ThemedView>

              <TouchableOpacity 
                style={[styles.option, { borderBottomColor: colors.border }]} 
                onPress={handleSync}
                disabled={syncing}
              >
                <ThemedText style={styles.optionText}>
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </ThemedText>
                <ThemedText style={styles.optionDescription}>
                  Sync your data with the server
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.option, { borderBottomColor: colors.border }]} 
                onPress={handleDisconnectWebDAV}
              >
                <ThemedText style={[styles.optionText, { color: colors.danger }]}>
                  Disconnect WebDAV
                </ThemedText>
                <ThemedText style={styles.optionDescription}>
                  Remove server connection
                </ThemedText>
              </TouchableOpacity>
            </>
          )}

          <ThemedView style={[styles.option, { borderBottomColor: colors.border }]}>
            <ThemedView style={styles.optionWithSwitch}>
              <ThemedView style={styles.optionTextContainer}>
                <ThemedText style={styles.optionText}>Auto Sync</ThemedText>
                <ThemedText style={styles.optionDescription}>
                  Automatically sync on app start (Coming Soon)
                </ThemedText>
              </ThemedView>
              <Switch
                value={autoArchive}
                onValueChange={setAutoArchive}
                disabled
              />
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>About</ThemedText>
          
          <ThemedView style={[styles.option, { borderBottomColor: colors.border }]}>
            <ThemedText style={styles.optionText}>Version</ThemedText>
            <ThemedText style={styles.optionDescription}>1.0.0</ThemedText>
          </ThemedView>

          <ThemedView style={[styles.option, { borderBottomColor: colors.border }]}>
            <ThemedText style={styles.optionText}>Storage Format</ThemedText>
            <ThemedText style={styles.optionDescription}>JSON (Human-readable)</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <TouchableOpacity style={[styles.dangerOption, { backgroundColor: colors.dangerBackground }]} onPress={handleClearAll}>
            <ThemedText style={[styles.dangerText, { color: colors.danger }]}>Clear All Data</ThemedText>
          </TouchableOpacity>
        </ThemedView>
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
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  themeButtonActive: {
  },
  themeButtonText: {
    fontSize: 14,
  },
  themeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
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
  },
  dangerText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
