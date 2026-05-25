import React, { useEffect } from 'react';
import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, Alert } from 'react-native';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import AppNavigator from './navigation/AppNavigator';

// Polyfill Alert.alert for Web, which is a stub/no-op in react-native-web
if (Platform.OS === 'web') {
  Alert.alert = (title, message, buttons) => {
    const formattedMessage = message ? `\n\n${message}` : '';
    if (buttons && buttons.length > 0) {
      // Find the confirm action (defaulting to the first non-cancel button, or first button)
      const confirmAction = buttons.find(b => b.style !== 'cancel') || buttons[0];
      const cancelAction = buttons.find(b => b.style === 'cancel');

      const confirmed = window.confirm(`${title}${formattedMessage}`);
      if (confirmed) {
        if (confirmAction && typeof confirmAction.onPress === 'function') {
          confirmAction.onPress();
        }
      } else {
        if (cancelAction && typeof cancelAction.onPress === 'function') {
          cancelAction.onPress();
        }
      }
    } else {
      window.alert(`${title}${formattedMessage}`);
    }
  };
}


SplashScreen.preventAutoHideAsync();

// Inner app that has access to theme context
function ThemedApp() {
  const { isDark, colors } = useTheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.bg} />
      <AppNavigator />
    </>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <ThemedApp />
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

registerRootComponent(App);
export default App;
