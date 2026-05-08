import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme/colors';
import AppInput from '../../components/forms/AppInput';
import AppButton from '../../components/buttons/AppButton';
import { userService } from '../../services/notificationService';
import { authService } from '../../services/authService';
import { ROLE_LABELS } from '../../utils/constants';

const ProfileScreen = () => {
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: user?.fullName || '', phone: user?.phone || '', department: user?.department || '' });
  const [loading, setLoading] = useState(false);
  const [changePw, setChangePw] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const setPw = (k) => (v) => setPwForm((f) => ({ ...f, [k]: v }));

  const saveProfile = async () => {
    setLoading(true);
    try {
      const res = await userService.updateProfile(form);
      updateUser(res.data.data);
      setEditing(false);
      Alert.alert('✅ Updated', 'Profile saved successfully');
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setLoading(false); }
  };

  const savePassword = async () => {
    if (!pwForm.currentPassword || !pwForm.newPassword) return Alert.alert('Required', 'Both fields required');
    setLoading(true);
    try {
      await authService.changePassword(pwForm);
      setChangePw(false);
      setPwForm({ currentPassword: '', newPassword: '' });
      Alert.alert('✅ Changed', 'Password updated');
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setLoading(false); }
  };

  const confirmLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.fullName?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <Text style={styles.name}>{user?.fullName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{ROLE_LABELS[user?.role]}</Text>
          </View>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Profile Information</Text>
            <TouchableOpacity onPress={() => setEditing((v) => !v)}>
              <Text style={styles.editBtn}>{editing ? 'Cancel' : '✏️ Edit'}</Text>
            </TouchableOpacity>
          </View>

          {editing ? (
            <>
              <AppInput label="Full Name" value={form.fullName} onChangeText={set('fullName')} placeholder="Full name" />
              <AppInput label="Phone" value={form.phone} onChangeText={set('phone')} placeholder="+254700000000" keyboardType="phone-pad" />
              <AppInput label="Department" value={form.department} onChangeText={set('department')} placeholder="Department" />
              <AppButton title="Save Changes" onPress={saveProfile} loading={loading} />
            </>
          ) : (
            <>
              <InfoRow label="Phone" value={user?.phone || '—'} />
              <InfoRow label="Department" value={user?.department || '—'} />
            </>
          )}
        </View>

        {/* Change Password */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.cardHeader} onPress={() => setChangePw((v) => !v)}>
            <Text style={styles.cardTitle}>🔒 Change Password</Text>
            <Text style={styles.editBtn}>{changePw ? 'Cancel' : 'Change'}</Text>
          </TouchableOpacity>
          {changePw && (
            <>
              <AppInput label="Current Password" value={pwForm.currentPassword} onChangeText={setPw('currentPassword')} secureTextEntry placeholder="Current password" style={{ marginTop: 12 }} />
              <AppInput label="New Password" value={pwForm.newPassword} onChangeText={setPw('newPassword')} secureTextEntry placeholder="Min 8 chars with special char" />
              <AppButton title="Update Password" onPress={savePassword} loading={loading} />
            </>
          )}
        </View>

        {/* Sign Out */}
        <AppButton title="Sign Out" onPress={confirmLogout} variant="danger" style={styles.logoutBtn} />
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoRow = ({ label, value }) => (
  <View style={infoStyles.row}>
    <Text style={infoStyles.label}>{label}</Text>
    <Text style={infoStyles.value}>{value}</Text>
  </View>
);
const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider },
  label: { fontSize: 14, color: colors.textSecondary },
  value: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 3, borderColor: colors.primaryLight },
  avatarText: { fontSize: 36, fontWeight: '700', color: colors.white },
  name: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  roleBadge: { backgroundColor: colors.primary + '22', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginTop: 6, borderWidth: 1, borderColor: colors.primary + '44' },
  roleText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  email: { fontSize: 13, color: colors.textSecondary, marginTop: 6 },
  card: { backgroundColor: colors.bgCard, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  editBtn: { fontSize: 14, color: colors.primary, fontWeight: '500' },
  logoutBtn: { marginTop: 8, marginBottom: 20 },
});

export default ProfileScreen;
