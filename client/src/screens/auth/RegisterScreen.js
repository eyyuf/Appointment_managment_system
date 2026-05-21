import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import AppButton from '../../components/buttons/AppButton';
import AppInput from '../../components/forms/AppInput';
import { validateEmail, validatePassword, validateRequired } from '../../utils/validators';
import { ROLES, ROLE_LABELS } from '../../utils/constants';

const ROLE_OPTIONS = [ROLES.STUDENT, ROLES.SECRETARY, ROLES.DEPARTMENT_HEAD, ROLES.DEAN, ROLES.VICE_PRESIDENT, ROLES.PRESIDENT];

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const { colors } = useTheme();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: ROLES.STUDENT, phone: '', department: '' });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    const nameErr = validateRequired(form.fullName, 'Full name');
    if (nameErr) e.fullName = nameErr;
    const emailErr = validateEmail(form.email);
    if (emailErr) e.email = emailErr;
    const pwErr = validatePassword(form.password);
    if (pwErr) e.password = pwErr;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ ...form, email: form.email.trim().toLowerCase() });
      Alert.alert('Success', 'Institutional account created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Registration Failed', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.sub}>Provision a new institutional account</Text>
          </View>

          <View style={styles.card}>
            <AppInput label="Full Name" value={form.fullName} onChangeText={set('fullName')} placeholder="Dr. John Doe" error={errors.fullName} />
            <AppInput label="Email" value={form.email} onChangeText={set('email')} placeholder="you@university.edu" keyboardType="email-address" error={errors.email} />
            <AppInput label="Temporary Password" value={form.password} onChangeText={set('password')} placeholder="Min 8 chars" secureTextEntry={!showPw} rightIcon={showPw ? '🙈' : '👁️'} onRightIconPress={() => setShowPw((v) => !v)} error={errors.password} />
            <AppInput label="Phone (optional)" value={form.phone} onChangeText={set('phone')} placeholder="+254700000000" keyboardType="phone-pad" />
            <AppInput label="Department (optional)" value={form.department} onChangeText={set('department')} placeholder="Computer Science" />

            <Text style={styles.roleLabel}>Role</Text>
            <View style={styles.roleGrid}>
              {ROLE_OPTIONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleChip, form.role === r && styles.roleChipActive]}
                  onPress={() => set('role')(r)}
                >
                  <Text style={[styles.roleChipText, form.role === r && styles.roleChipTextActive]}>
                    {ROLE_LABELS[r]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <AppButton title="Create Account" onPress={handleRegister} loading={loading} style={{ marginTop: 8 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1 },
  header: { padding: 24, paddingTop: 16 },
  back: { marginBottom: 16 },
  backText: { color: colors.primary, fontSize: 15 },
  title: { fontSize: 26, fontWeight: '800', color: colors.textPrimary },
  sub: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  card: { backgroundColor: colors.bgCard, margin: 20, marginTop: 0, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.border },
  roleLabel: { fontSize: 13, fontWeight: '500', color: colors.textSecondary, marginBottom: 10 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  roleChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgElevated },
  roleChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
  roleChipText: { fontSize: 12, color: colors.textSecondary },
  roleChipTextActive: { color: colors.primary, fontWeight: '600' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginText: { color: colors.textSecondary, fontSize: 14 },
  loginLink: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});

export default RegisterScreen;
