import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, FlatList, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { userService } from '../../services/notificationService';
import AppButton from '../../components/buttons/AppButton';
import { ROLE_LABELS } from '../../utils/constants';

const AdminDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userService.getAll({ limit: 100 });
      const list = res.data.data.users || [];
      setUsers(list);
      setStats({
        total: list.length,
        active: list.filter(u => u.isActive).length,
        inactive: list.filter(u => !u.isActive).length
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, []);

  const toggleUserStatus = async (id, currentStatus) => {
    try {
      await userService.toggleActive(id);
      loadUsers();
    } catch (err) {
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadUsers} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Admin Panel</Text>
          <Text style={styles.sub}>System Management & Oversight</Text>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: 'Total Users', val: stats.total, color: colors.primary },
            { label: 'Active', val: stats.active, color: colors.success },
            { label: 'Deactivated', val: stats.inactive, color: colors.error },
          ].map((s) => (
            <View key={s.label} style={[styles.stat, { borderTopColor: s.color }]}>
              <Text style={[styles.statNum, { color: s.color }]}>{s.val}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.createBtnText}>➕ Create New Institutional Account</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Directory</Text>
          {users.map((u) => (
            <View key={u.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{u.fullName}</Text>
                <Text style={styles.userEmail}>{u.email}</Text>
                <View style={styles.userMeta}>
                  <Text style={styles.userRole}>{ROLE_LABELS[u.role]}</Text>
                  {u.department && <Text style={styles.userDept}> • {u.department}</Text>}
                </View>
              </View>
              <View style={styles.userActions}>
                <TouchableOpacity
                  onPress={() => toggleUserStatus(u.id, u.isActive)}
                  style={[styles.statusToggle, u.isActive ? styles.btnDeactivate : styles.btnActivate]}
                >
                  <Text style={styles.statusToggleText}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 24, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  sub: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  stat: { flex: 1, backgroundColor: colors.bgCard, borderRadius: 12, padding: 12, alignItems: 'center', borderTopWidth: 3, borderWidth: 1, borderColor: colors.border },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLbl: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  createBtn: { marginHorizontal: 20, backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 24 },
  createBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  section: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
  userCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  userEmail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  userMeta: { flexDirection: 'row', marginTop: 4 },
  userRole: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  userDept: { fontSize: 11, color: colors.textMuted },
  statusToggle: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  btnDeactivate: { backgroundColor: colors.error + '22' },
  btnActivate: { backgroundColor: colors.success + '22' },
  statusToggleText: { fontSize: 12, fontWeight: '600' },
});

export default AdminDashboard;
