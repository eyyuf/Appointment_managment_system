import React, { useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
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

const TabIcon = ({ name, focused, color, size, showAlert, styles }) => {
  let iconName;
  if (name === 'Home') {
    iconName = focused ? 'home' : 'home-outline';
  } else if (name === 'Calendar') {
    iconName = focused ? 'calendar' : 'calendar-outline';
  } else if (name === 'Notifications') {
    iconName = focused ? 'notifications' : 'notifications-outline';
  } else if (name === 'Profile') {
    iconName = focused ? 'person' : 'person-outline';
  }
  const isNotification = name === 'Notifications';
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isNotification || !showAlert) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [isNotification, showAlert, pulse]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] });

  if (!isNotification) {
    return <Ionicons name={iconName} size={size || 24} color={color} />;
  }

  return (
    <View style={styles.iconWrap}>
      <Ionicons name={iconName} size={size || 24} color={color} />
      {showAlert && (
        <>
          <Animated.View style={[styles.alertRing, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
          <View style={styles.alertDot} />
        </>
      )}
    </View>
  );
};

const TabNavigator = ({ userRole }) => {
  const { colors } = useTheme();
  const { unreadCount } = useNotifications();
  const dashType = getDashboardType(userRole);

  const DashboardComponent =
    dashType === 'secretary' ? SecretaryDashboard :
      dashType === 'leader' ? LeaderDashboard :
        dashType === 'admin' ? AdminDashboard :
          StudentDashboard;

  const styles = makeStyles(colors);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color, size }) => (
          <TabIcon
            name={route.name}
            focused={focused}
            color={color}
            size={size}
            showAlert={route.name === 'Notifications' && unreadCount > 0}
            styles={styles}
          />
        ),
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

const makeStyles = (colors) => StyleSheet.create({
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
  iconWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  alertDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    shadowColor: colors.error,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  alertRing: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
  },
});

export default TabNavigator;
