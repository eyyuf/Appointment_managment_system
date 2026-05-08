import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { colors } from '../../theme/colors';
import { appointmentService } from '../../services/appointmentService';
import AppointmentCard from '../../components/cards/AppointmentCard';
import { ROLE_LABELS } from '../../utils/constants';

const StudentDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const { unreadCount, fetchNotifications } = useNotifications();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ pending: 0, approved: 0, cancelled: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getAll({ limit: 10 });
      const list = res.data.data.appointments || [];
      setAppointments(list);
      setStats({
        pending: list.filter((a) => a.status === 'PENDING').length,
        approved: list.filter((a) => a.status === 'APPROVED').length,
        cancelled: list.filter((a) => a.status === 'CANCELLED').length,
      });
      fetchNotifications();
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, []);

  const statCards = [
    { label: 'Pending', value: stats.pending, color: colors.warning, icon: '⏳' },
    { label: 'Approved', value: stats.approved, color: colors.success, icon: '✅' },
    { label: 'Cancelled', value: stats.cancelled, color: colors.error, icon: '❌' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={colors.primary} />}
      >
        {/* Header */}
        <LinearGradient colors={[colors.bgCard, colors.bg]} style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>Hello, 👋</Text>
              <Text style={styles.name}>{user?.fullName}</Text>
              <Text style={styles.role}>{ROLE_LABELS[user?.role]}</Text>
            </View>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Text style={styles.notifIcon}>🔔</Text>
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          {statCards.map((s) => (
            <View key={s.label} style={[styles.statCard, { borderTopColor: s.color }]}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* New Appointment Button */}
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate('CreateAppointment')}
          activeOpacity={0.85}
        >
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.newBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.newBtnIcon}>➕</Text>
            <Text style={styles.newBtnText}>Request New Appointment</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Recent Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Appointments</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AppointmentHistory')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {appointments.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No appointments yet</Text>
              <Text style={styles.emptySub}>Tap the button above to request one</Text>
            </View>
          ) : (
            appointments.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onPress={() => navigation.navigate('AppointmentDetails', { id: appt.id })}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 24, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 14, color: colors.textSecondary },
  name: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  role: { fontSize: 12, color: colors.primary, fontWeight: '500', marginTop: 2 },
  notifBtn: { position: 'relative', padding: 8 },
  notifIcon: { fontSize: 26 },
  badge: { position: 'absolute', top: 4, right: 4, backgroundColor: colors.error, borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: '700' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: colors.bgCard, borderRadius: 12, padding: 12, alignItems: 'center', borderTopWidth: 2, borderColor: colors.border, borderWidth: 1 },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  newBtn: { marginHorizontal: 20, marginBottom: 20, borderRadius: 14, overflow: 'hidden' },
  newBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  newBtnIcon: { fontSize: 18 },
  newBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  section: { paddingHorizontal: 20, paddingBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  seeAll: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  emptySub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
});

export default StudentDashboard;
