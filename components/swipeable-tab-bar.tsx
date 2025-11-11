import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from './themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const iconMap: { [key: string]: { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap } } = {
  inbox: { focused: 'mail', unfocused: 'mail-outline' },
  today: { focused: 'today', unfocused: 'today-outline' },
  calendar: { focused: 'calendar', unfocused: 'calendar-outline' },
  projects: { focused: 'folder', unfocused: 'folder-outline' },
  settings: { focused: 'settings', unfocused: 'settings-outline' },
};

export function SwipeableTabBar({ navigationState, position, jumpTo }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { height: 60 + insets.bottom, paddingBottom: insets.bottom }]}>
      {navigationState.routes.map((route, i) => {
        const isFocused = navigationState.index === i;
        const iconName = isFocused ? iconMap[route.key].focused : iconMap[route.key].unfocused;
        const color = isFocused ? colors.tint : colors.tabIconDefault;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => jumpTo(route.key)}
            style={styles.tabItem}
          >
            <Ionicons name={iconName} size={24} color={color} />
            <ThemedText style={{ color, fontSize: 10 }}>{route.title}</ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
