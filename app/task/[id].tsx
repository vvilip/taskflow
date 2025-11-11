import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { TaskForm } from '@/components/task-form';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handleSave = () => {
    // This will be handled by the TaskForm's internal save
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

      <TaskForm id={id} onSave={() => router.back()} onClose={() => router.back()} />
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
});
