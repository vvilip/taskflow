import React, { useRef } from 'react';
import { StyleSheet, TouchableOpacity, Platform, Dimensions, Keyboard } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { TaskForm } from '@/components/task-form';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ModalScreen() {
  const taskFormRef = useRef<{ handleSave: () => void }>(null);
  const translateY = useSharedValue(0);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handleClose = () => {
    taskFormRef.current?.handleSave();
    router.dismiss();
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const pan = Gesture.Pan()
    .onStart(() => {
      runOnJS(dismissKeyboard)();
    })
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd(() => {
      if (translateY.value > SCREEN_HEIGHT * 0.3) {
        translateY.value = withTiming(SCREEN_HEIGHT, {}, () => {
          runOnJS(handleClose)();
        });
      } else {
        translateY.value = withTiming(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity 
        style={styles.overlay} 
        onPress={handleClose}
        activeOpacity={1}
      />
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.modal, animatedStyle]}>
          <ThemedView style={styles.handle} />
          <ThemedView style={{ flex: 1, backgroundColor: colors.background }}>
            <TaskForm ref={taskFormRef} id="new" onSave={() => router.dismiss()} />
          </ThemedView>
        </Animated.View>
      </GestureDetector>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modal: {
    height: '90%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 16,
    backgroundColor: 'white',
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
