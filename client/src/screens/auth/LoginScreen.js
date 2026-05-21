import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, TouchableOpacity, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import AppButton from '../../components/buttons/AppButton';
import AppInput from '../../components/forms/AppInput';
import { validateEmail, validatePassword } from '../../utils/validators';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    const emailErr = validateEmail(email);
    if (emailErr) e.email = emailErr;
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header Gradient */}
          <LinearGradient colors={[colors.bg, colors.bgElevated]} style={styles.header}>
            <View style={styles.logoWrap}>
              <Text style={styles.logoIcon}>🎓</Text>
            </View>
            <Text style={styles.appName}>UniAppoint</Text>
            <Text style={styles.tagline}>University Leadership Appointments</Text>
          </LinearGradient>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSub}>Sign in to your account</Text>

            <AppInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="your@university.edu"
              keyboardType="email-address"
              error={errors.email}
            />
            <AppInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              secureTextEntry={!showPw}
              rightIcon="👁️"
              onRightIconPress={() => setShowPw((v) => !v)}
              error={errors.password}
            />

            <AppButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginBtn}
            />
          </View>


        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  logoWrap: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: colors.bgElevated,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: colors.primary + '55',
  },
  logoIcon: { fontSize: 40 },
  appName: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.5 },
  tagline: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  formCard: {
    backgroundColor: colors.bgCard, margin: 20, borderRadius: 24,
    padding: 24, borderWidth: 1, borderColor: colors.border,
  },
  formTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  formSub: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },
  loginBtn: { marginTop: 8 },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  registerText: { color: colors.textSecondary, fontSize: 14 },
  registerLink: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});

export default LoginScreen;
