import React, { useRef } from 'react';
import { StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { TaskForm } from '@/components/task-form';

export default function ModalScreen() {
  const taskFormRef = useRef<{ handleSave: () => void }>(null);

  const handleClose = () => {
    taskFormRef.current?.handleSave();
    router.back();
  };

  const pan = Gesture.Pan()
    .onEnd((e) => {
      if (e.translationY > 100) {
        runOnJS(handleClose)();
      }
    });

  return (
    <GestureDetector gesture={pan}>
      <ThemedView style={styles.container}>
        <TouchableOpacity style={styles.overlay} onPress={handleClose} />
        <ThemedView style={styles.modal}>
          <ThemedView style={styles.handle} />
          <TaskForm ref={taskFormRef} id="new" onSave={router.back} />
        </ThemedView>
      </ThemedView>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    height: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    paddingTop: 16,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
});
