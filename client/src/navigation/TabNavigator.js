import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { useNotifications } from '../hooks/useNotifications';
import { getDashboardType } from '../utils/rolePermissions';

// Screens
import StudentDashboard from '../screens/dashboard/StudentDashboard';
import SecretaryDashboard from '../screens/dashboard/SecretaryDashboard';
import LeaderDashboard from '../screens/dashboard/LeaderDashboard';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import NotificationScreen from '../screens/notifications/NotificationScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import AdminDashboard from '../screens/dashboard/AdminDashboard';

const Tab = createBottomTabNavigator();

const TabIcon = ({ name, focused }) => {
  const labels = {
    Home: 'Home',
    Calendar: 'Cal',
    Notifications: 'Notif',
    Profile: 'Me',
  };
  return (
    <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
      {labels[name] || name}
    </Text>
  );
};

const TabNavigator = ({ userRole }) => {
  const { unreadCount } = useNotifications();
  const dashType = getDashboardType(userRole);

  const DashboardComponent =
    dashType === 'secretary' ? SecretaryDashboard :
    dashType === 'leader' ? LeaderDashboard :
    dashType === 'admin' ? AdminDashboard :
    StudentDashboard;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home" component={DashboardComponent} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen
        name="Notifications"
        component={NotificationScreen}
        options={{
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: styles.badge,
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bgCard,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 65,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tabLabel: { fontSize: 11, fontWeight: '500' },
  badge: { backgroundColor: colors.error, color: colors.white, fontSize: 10 },
  tabIcon: { fontSize: 10, fontWeight: '600', color: colors.textMuted, textAlign: 'center' },
  tabIconActive: { color: colors.primary },
});

export default TabNavigator;
