import React, { useState } from 'react';
import { Dimensions } from 'react-native';
import { TabView, SceneMap } from 'react-native-tab-view';
import InboxScreen from './index';
import TodayScreen from './today';
import CalendarScreen from './calendar';
import ProjectsScreen from './projects';
import SettingsScreen from './settings';
import { SwipeableTabBar } from '@/components/swipeable-tab-bar';

const renderScene = SceneMap({
  inbox: InboxScreen,
  today: TodayScreen,
  calendar: CalendarScreen,
  projects: ProjectsScreen,
  settings: SettingsScreen,
});

export default function TabLayout() {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'inbox', title: 'Inbox' },
    { key: 'today', title: 'Today' },
    { key: 'calendar', title: 'Calendar' },
    { key: 'projects', title: 'Projects' },
    { key: 'settings', title: 'Settings' },
  ]);

  const initialLayout = { width: Dimensions.get('window').width };

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={initialLayout}
      tabBarPosition="bottom"
      renderTabBar={props => <SwipeableTabBar {...props} />}
    />
  );
}