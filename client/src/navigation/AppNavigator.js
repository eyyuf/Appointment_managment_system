import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme/colors';

import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import ChangePasswordOnFirstLogin from '../screens/auth/ChangePasswordOnFirstLogin';

// Appointment screens (pushed on top of tabs)
import CreateAppointment from '../screens/appointments/CreateAppointment';
import AppointmentDetails from '../screens/appointments/AppointmentDetails';
import RescheduleAppointment from '../screens/appointments/RescheduleAppointment';
import AppointmentHistory from '../screens/appointments/AppointmentHistory';
import RegisterScreen from '../screens/auth/RegisterScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : user.mustChangePassword ? (
          <Stack.Screen name="FirstLogin" component={ChangePasswordOnFirstLogin} />
        ) : (
          <>
            <Stack.Screen name="Main">
              {() => <TabNavigator userRole={user.role} />}
            </Stack.Screen>
            <Stack.Screen name="CreateAppointment" component={CreateAppointment}
              options={{ headerShown: true, title: 'New Appointment',
                headerStyle: { backgroundColor: colors.bgCard },
                headerTintColor: colors.textPrimary }} />
            <Stack.Screen name="AppointmentDetails" component={AppointmentDetails}
              options={{ headerShown: true, title: 'Appointment Details',
                headerStyle: { backgroundColor: colors.bgCard },
                headerTintColor: colors.textPrimary }} />
            <Stack.Screen name="RescheduleAppointment" component={RescheduleAppointment}
              options={{ headerShown: true, title: 'Reschedule',
                headerStyle: { backgroundColor: colors.bgCard },
                headerTintColor: colors.textPrimary }} />
            <Stack.Screen name="AppointmentHistory" component={AppointmentHistory}
              options={{ headerShown: true, title: 'History',
                headerStyle: { backgroundColor: colors.bgCard },
                headerTintColor: colors.textPrimary }} />
            <Stack.Screen name="Register" component={RegisterScreen}
              options={{ headerShown: true, title: 'Create Account',
                headerStyle: { backgroundColor: colors.bgCard },
                headerTintColor: colors.textPrimary }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
