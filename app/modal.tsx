import React, { useRef } from 'react';
import { StyleSheet, TouchableOpacity, Platform, Dimensions, Keyboard } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { router, useRouter, useLocalSearchParams } from 'expo-router';
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
  const translateY = useSharedValue(0);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();

  const handleClose = () => {
    if (router.canDismiss()) {
      router.dismiss();
    } else if (router.canGoBack()) {
      router.back();
    }
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
      <Animated.View style={[styles.modal, animatedStyle]}>
        <GestureDetector gesture={pan}>
          <ThemedView style={styles.handleContainer}>
            <ThemedView style={styles.handle} />
          </ThemedView>
        </GestureDetector>
        <ThemedView style={[styles.formContainer, { backgroundColor: colors.background }]}>
          <TaskForm id={taskId ?? 'new'} onSave={handleClose} />
        </ThemedView>
      </Animated.View>
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
  },
  handleContainer: {
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
  },
  formContainer: {
    flex: 1,
    overflow: 'hidden',
  },
});
