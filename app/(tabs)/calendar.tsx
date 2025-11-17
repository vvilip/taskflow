import React, { useEffect, useState } from 'react';
import { StyleSheet, Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { TaskList } from '@/components/task-list';
import { FabButton } from '@/components/fab-button';
import { Task } from '@/types/gtd';
import { taskService } from '@/services';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksByDate, setTasksByDate] = useState<Record<string, number>>({});
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  useFocusEffect(
    React.useCallback(() => {
      loadTasks();
    }, [currentMonth])
  );

  const loadTasks = async () => {
    try {
      const allTasks = await taskService.getAllTasks();
      const tasksWithDates = allTasks.filter(t => t.dueDate && !t.completed);
      
      // Count tasks per date
      const counts: Record<string, number> = {};
      tasksWithDates.forEach(task => {
        if (task.dueDate) {
          const dateKey = getDateKey(new Date(task.dueDate));
          counts[dateKey] = (counts[dateKey] || 0) + 1;
        }
      });
      setTasksByDate(counts);
      
      // Filter tasks for selected date
      filterTasksForDate(selectedDate, allTasks);
    } catch (error) {
      Alert.alert('Error', 'Failed to load tasks');
    }
  };

  const filterTasksForDate = (date: Date, allTasks?: Task[]) => {
    const dateKey = getDateKey(date);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    taskService.getAllTasks().then(tasks => {
      const filtered = tasks.filter(task => {
        if (!task.dueDate || task.completed) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate >= startOfDay && taskDate <= endOfDay;
      });
      setTasks(filtered);
    });
  };

  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
    filterTasksForDate(newDate);
  };

  const handlePrevMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const handleToggleComplete = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      if (task.completed) {
        await taskService.uncompleteTask(taskId);
        await loadTasks();
      } else {
        setTasks(prevTasks => 
          prevTasks.map(t => t.id === taskId ? { ...t, completed: true } : t)
        );
        
        await taskService.completeTask(taskId);
        
        setTimeout(() => {
          loadTasks();
        }, 1700);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
      await loadTasks();
    }
  };

  const handleTaskPress = (task: Task) => {
    router.push({ pathname: '/modal', params: { taskId: task.id } });
  };

  const handleAddTask = () => {
    router.push('/modal');
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Week day headers
    const headers = weekDays.map(day => (
      <ThemedView key={day} style={styles.dayHeader}>
        <ThemedText style={styles.dayHeaderText}>{day}</ThemedText>
      </ThemedView>
    ));

    // Empty cells before first day
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateKey = getDateKey(date);
      const taskCount = tasksByDate[dateKey] || 0;
      const isSelected = selectedDate.getDate() === day && 
                        selectedDate.getMonth() === currentMonth.getMonth() &&
                        selectedDate.getFullYear() === currentMonth.getFullYear();
      const isToday = new Date().getDate() === day && 
                     new Date().getMonth() === currentMonth.getMonth() &&
                     new Date().getFullYear() === currentMonth.getFullYear();

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isToday && [styles.today, { borderColor: colors.tint }],
            isSelected && [styles.selectedDay, { backgroundColor: colors.tint }],
          ]}
          onPress={() => handleDateSelect(day)}
        >
          <View style={styles.dayCellContent}>
            <ThemedText style={[
              styles.dayText,
              isSelected && styles.selectedDayText,
            ]}>
              {day}
            </ThemedText>
            {taskCount > 0 && (
              <View style={[styles.taskBadge, { backgroundColor: isSelected ? '#fff' : colors.tint }]}>
                <ThemedText style={[styles.taskBadgeText, { color: isSelected ? colors.tint : '#fff' }]}>
                  {taskCount}
                </ThemedText>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.calendar}>
        <View style={styles.weekDays}>{headers}</View>
        <View style={styles.daysGrid}>{days}</View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Calendar</ThemedText>
        </ThemedView>

        <ThemedView style={styles.monthSelector}>
        <TouchableOpacity onPress={handlePrevMonth}>
          <ThemedText style={[styles.monthButton, { color: colors.tint }]}>←</ThemedText>
        </TouchableOpacity>
        <ThemedText type="subtitle">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </ThemedText>
        <TouchableOpacity onPress={handleNextMonth}>
          <ThemedText style={[styles.monthButton, { color: colors.tint }]}>→</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ScrollView style={styles.scrollView}>
        {renderCalendar()}

        <ThemedView style={styles.tasksSection}>
          <ThemedText type="subtitle" style={styles.tasksSectionTitle}>
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </ThemedText>
          <TaskList
            tasks={tasks}
            onTaskPress={handleTaskPress}
            onToggleComplete={handleToggleComplete}
            emptyMessage="No tasks for this day"
            scrollable={false}
          />
        </ThemedView>
      </ScrollView>

      <FabButton onPress={handleAddTask} />
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
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  monthButton: {
    fontSize: 32,
    fontWeight: 'bold',
    paddingHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  calendar: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 4,
  },
  dayCellContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  today: {
    borderWidth: 2,
    borderRadius: 8,
  },
  selectedDay: {
    borderRadius: 8,
  },
  dayText: {
    fontSize: 16,
    textAlign: 'center',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  taskBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    lineHeight: 9,
    includeFontPadding: false,
  },
  tasksSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  tasksSectionTitle: {
    marginBottom: 12,
  },
});
