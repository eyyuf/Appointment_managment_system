import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { colors } from '../../theme/colors';
import { appointmentService } from '../../services/appointmentService';
import AppointmentCard from '../../components/cards/AppointmentCard';
import { ROLE_LABELS, STATUS_LABELS } from '../../utils/constants';

const STATUS_COLORS = {
  PENDING: colors.warning,
  UNDER_REVIEW: colors.primary,
  FORWARDED: '#9C6EFF',
  APPROVED: colors.success,
  REJECTED: colors.error,
  CANCELLED: colors.textMuted,
  RESCHEDULED: '#FF9500',
  COMPLETED: colors.success,
};

const StudentDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const { unreadCount, fetchNotifications } = useNotifications();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getAll({ limit: 20 });
      const list = res.data.data.appointments || [];
      setAppointments(list);
      fetchNotifications();
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, []);

  const active = appointments.filter((a) => ['PENDING', 'UNDER_REVIEW', 'FORWARDED'].includes(a.status));
  const approved = appointments.filter((a) => a.status === 'APPROVED');
  const past = appointments.filter((a) => ['REJECTED', 'CANCELLED', 'COMPLETED'].includes(a.status));

  const statCards = [
    { label: 'Active', value: active.length, color: colors.primary },
    { label: 'Approved', value: approved.length, color: colors.success },
    { label: 'Past', value: past.length, color: colors.textMuted },
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
              <Text style={styles.greeting}>Hello,</Text>
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
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Workflow Info Banner */}
        <View style={styles.workflowBanner}>
          <Text style={styles.workflowTitle}>How it works</Text>
          <View style={styles.workflowSteps}>
            {[
              { step: '1', label: 'Submit Request', sub: 'Select department & reason' },
              { step: '2', label: 'Secretary Reviews', sub: 'Routes to right leader' },
              { step: '3', label: 'Leader Decides', sub: 'Approve or reject' },
            ].map((s, i) => (
              <View key={s.step} style={styles.workflowStep}>
                <View style={styles.stepBubble}>
                  <Text style={styles.stepNum}>{s.step}</Text>
                </View>
                <Text style={styles.stepLabel}>{s.label}</Text>
                <Text style={styles.stepSub}>{s.sub}</Text>
                {i < 2 && <Text style={styles.stepArrow}>→</Text>}
              </View>
            ))}
          </View>
        </View>

        {/* New Appointment Button */}
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate('CreateAppointment')}
          activeOpacity={0.85}
        >
          <LinearGradient colors={[colors.primary, colors.primaryDark || '#3355DD']} style={styles.newBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.newBtnText}>+ Request New Appointment</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Active Appointments */}
        {active.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Requests</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AppointmentHistory')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {active.map((appt) => (
              <View key={appt.id} style={styles.apptWrap}>
                <AppointmentCard
                  appointment={appt}
                  onPress={() => navigation.navigate('AppointmentDetails', { id: appt.id })}
                />
                {/* Status progression */}
                <View style={[styles.statusBar, { backgroundColor: STATUS_COLORS[appt.status] + '22', borderColor: STATUS_COLORS[appt.status] + '44' }]}>
                  <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[appt.status] }]} />
                  <Text style={[styles.statusText, { color: STATUS_COLORS[appt.status] }]}>
                    {STATUS_LABELS[appt.status]}
                    {appt.status === 'PENDING' && ' — Awaiting secretary review'}
                    {appt.status === 'UNDER_REVIEW' && ' — Secretary is reviewing'}
                    {appt.status === 'FORWARDED' && ` — Forwarded to ${appt.leader?.fullName || 'leader'}`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Approved Appointments */}
        {approved.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            {approved.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onPress={() => navigation.navigate('AppointmentDetails', { id: appt.id })}
              />
            ))}
          </View>
        )}

        {/* Empty State */}
        {appointments.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No appointments yet</Text>
            <Text style={styles.emptySub}>Tap the button above to submit your first request</Text>
          </View>
        )}
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
  statCard: { flex: 1, backgroundColor: colors.bgCard, borderRadius: 12, padding: 12, alignItems: 'center', borderTopWidth: 2, borderWidth: 1, borderColor: colors.border },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  // Workflow Banner
  workflowBanner: { marginHorizontal: 20, backgroundColor: colors.bgCard, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  workflowTitle: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  workflowSteps: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  workflowStep: { flex: 1, alignItems: 'center', position: 'relative' },
  stepBubble: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  stepNum: { color: colors.white, fontSize: 13, fontWeight: '700' },
  stepLabel: { fontSize: 10, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
  stepSub: { fontSize: 9, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
  stepArrow: { position: 'absolute', right: -8, top: 6, color: colors.textMuted, fontSize: 14 },
  // New Button
  newBtn: { marginHorizontal: 20, marginBottom: 20, borderRadius: 14, overflow: 'hidden' },
  newBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  newBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
  // Sections
  section: { paddingHorizontal: 20, paddingBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  seeAll: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  apptWrap: { marginBottom: 4 },
  statusBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, padding: 8, marginBottom: 12, gap: 6, borderWidth: 1 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '600', flex: 1 },
  // Empty
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  emptySub: { fontSize: 13, color: colors.textMuted, marginTop: 4, textAlign: 'center', paddingHorizontal: 30 },
});

export default StudentDashboard;
