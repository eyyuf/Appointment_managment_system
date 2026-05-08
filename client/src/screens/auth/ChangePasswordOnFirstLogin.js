import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme/colors';
import AppButton from '../../components/buttons/AppButton';
import AppInput from '../../components/forms/AppInput';
import { authService } from '../../services/authService';

const ChangePasswordOnFirstLogin = () => {
  const { user, updateUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return Alert.alert('Error', 'All fields are required');
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match');
    }
    if (newPassword.length < 8) {
      return Alert.alert('Error', 'New password must be at least 8 characters');
    }

    setLoading(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      // Update user state to reflect mustChangePassword = false
      updateUser({ ...user, mustChangePassword: false });
      Alert.alert('Success', 'Password changed successfully. You can now access the system.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <Text style={styles.title}>🔒 Security Update</Text>
            <Text style={styles.subtitle}>
              This is your first login. For security reasons, you must change your temporary password before continuing.
            </Text>

            <AppInput
              label="Temporary Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholder="Enter current temporary password"
            />

            <AppInput
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="Enter new password"
            />

            <AppInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Confirm new password"
            />

            <AppButton
              title="Update Password & Continue"
              onPress={handleUpdate}
              loading={loading}
              style={styles.btn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: colors.bgCard,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 24, textAlign: 'center', lineHeight: 20 },
  btn: { marginTop: 16 },
});

export default ChangePasswordOnFirstLogin;
