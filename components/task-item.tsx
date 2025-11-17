import React, { useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, Animated } from 'react-native';
import { Task } from '@/types/gtd';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface TaskItemProps {
  task: Task;
  onPress: () => void;
  onToggleComplete: () => void;
}

export function TaskItem({ task, onPress, onToggleComplete }: TaskItemProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const strikeAnim = useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = React.useState(0);

  const priorityColor = task.priority === 'high' ? '#ef4444' : 
                       task.priority === 'medium' ? '#f59e0b' : 
                       colors.subtitle;

  useEffect(() => {
    if (task.completed) {
      // Animate strikethrough
      Animated.parallel([
        Animated.timing(strikeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0.98,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ])
      ]).start(() => {
        // Wait 1 second, then fade out
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }, 1000);
      });
    } else {
      // Reset animations when uncompleted
      fadeAnim.setValue(1);
      scaleAnim.setValue(1);
      strikeAnim.setValue(0);
    }
  }, [task.completed]);

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date >= today && date < tomorrow) return 'Today';
    if (date >= tomorrow && date < new Date(tomorrow.getTime() + 86400000)) return 'Tomorrow';
    if (date < today) return '⚠️ Overdue';
    
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  const strikeWidth = strikeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, textWidth],
  });

  return (
    <Animated.View style={[
      styles.container,
      {
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }
    ]}>
      <TouchableOpacity 
        style={[
          styles.checkbox, 
          { borderColor: colors.placeholder },
          task.completed && [styles.checkboxCompleted, { backgroundColor: colors.tint }]
        ]}
        onPress={onToggleComplete}
      >
        {task.completed && <ThemedText style={styles.checkmark}>✓</ThemedText>}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.content} onPress={onPress}>
        <View style={styles.header}>
          {task.priority && (
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]} />
          )}
          <View style={styles.titleWrapper}>
            <View style={styles.titleContainer}>
              <ThemedText 
                style={[
                  styles.title,
                  task.completed && styles.completedText
                ]}
                numberOfLines={1}
                onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
              >
                {task.title}
              </ThemedText>
              {task.completed && (
                <Animated.View 
                  style={[
                    styles.strikeLine, 
                    { 
                      width: strikeWidth,
                      backgroundColor: colors.text,
                    }
                  ]} 
                />
              )}
            </View>
          </View>
        </View>
        
        {(task.description || task.dueDate) && (
          <View style={styles.meta}>
            {task.description && (
              <ThemedText style={styles.description} numberOfLines={1}>
                {task.description}
              </ThemedText>
            )}
            {task.dueDate && (
              <ThemedText style={[styles.dueDate, task.dueDate < Date.now() && styles.overdue]}>
                {formatDate(task.dueDate)}
              </ThemedText>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxCompleted: {
    borderWidth: 0,
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  titleWrapper: {
    flex: 1,
  },
  titleContainer: {
    alignSelf: 'flex-start',
    position: 'relative',
  },
  title: {
    fontSize: 16,
  },
  completedText: {
    opacity: 0.5,
  },
  strikeLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    height: 2,
    opacity: 0.6,
  },
  meta: {
    marginTop: 4,
    gap: 4,
  },
  description: {
    fontSize: 14,
    opacity: 0.7,
  },
  dueDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  overdue: {
    color: '#ef4444',
    fontWeight: '600',
  },
});
