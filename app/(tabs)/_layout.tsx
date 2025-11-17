import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

const { Navigator } = createMaterialTopTabNavigator();
const MaterialTopTabs = withLayoutContext(Navigator);

function CustomTabBar({ state, descriptors, navigation }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  const iconMap = {
    index: { focused: 'mail', unfocused: 'mail-outline' },
    today: { focused: 'today', unfocused: 'today-outline' },
    calendar: { focused: 'calendar', unfocused: 'calendar-outline' },
    projects: { focused: 'folder', unfocused: 'folder-outline' },
    settings: { focused: 'settings', unfocused: 'settings-outline' },
  };

  return (
    <View style={[styles.tabBar, { 
      height: 60 + insets.bottom, 
      paddingBottom: insets.bottom,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const iconName = isFocused ? iconMap[route.name]?.focused : iconMap[route.name]?.unfocused;
        const color = isFocused ? colors.tint : colors.tabIconDefault;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
          >
            <Ionicons name={iconName} size={24} color={color} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <MaterialTopTabs
      tabBarPosition="bottom"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        swipeEnabled: true,
        animationEnabled: true,
        lazy: true,
      }}
      initialRouteName="index"
    >
      <MaterialTopTabs.Screen name="index" />
      <MaterialTopTabs.Screen name="today" />
      <MaterialTopTabs.Screen name="calendar" />
      <MaterialTopTabs.Screen name="projects" />
      <MaterialTopTabs.Screen name="settings" />
    </MaterialTopTabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});