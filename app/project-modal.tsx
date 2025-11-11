import React from 'react';
import { StyleSheet, TouchableOpacity, Platform, Dimensions, Keyboard } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { router, useLocalSearchParams } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { ProjectForm } from '@/components/project-form';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ProjectModalScreen() {
  const translateY = useSharedValue(0);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();
  const projectFormRef = React.useRef<any>(null);

  const handleClose = async () => {
    // Try to save before closing
    if (projectFormRef.current?.handleSave) {
      await projectFormRef.current.handleSave();
    }
    
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
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (translateY.value > SCREEN_HEIGHT * 0.3 || event.velocityY > 500) {
        translateY.value = withTiming(SCREEN_HEIGHT, {}, () => {
          runOnJS(handleClose)();
        });
      } else {
        translateY.value = withTiming(0);
      }
    })
    .simultaneousWithExternalGesture();

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
          <ThemedView style={styles.handleContainer}>
            <ThemedView style={styles.handle} />
          </ThemedView>
          <ThemedView style={[styles.formContainer, { backgroundColor: colors.background }]}>
            <ProjectForm ref={projectFormRef} id={projectId ?? 'new'} onSave={handleClose} />
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
    overflow: 'hidden',
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
