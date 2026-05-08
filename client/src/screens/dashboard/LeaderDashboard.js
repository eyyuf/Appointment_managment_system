import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme/colors';
import { appointmentService } from '../../services/appointmentService';
import AppointmentCard from '../../components/cards/AppointmentCard';
import AppButton from '../../components/buttons/AppButton';
import { ROLE_LABELS } from '../../utils/constants';

const LeaderDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getAll({ limit: 20 });
      setAppointments(res.data.data.appointments || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const pending = appointments.filter((a) => ['PENDING', 'SECRETARY_APPROVED'].includes(a.status));
  const upcoming = appointments.filter((a) => a.status === 'APPROVED');

  const approve = async (id) => {
    setActionLoading(id);
    try {
      await appointmentService.leaderApprove(id, '');
      Alert.alert('✅ Approved', 'Appointment confirmed');
      load();
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setActionLoading(null); }
  };

  const reject = (id) => {
    Alert.prompt('Reject', 'Reason for rejection:', async (reason) => {
      if (!reason?.trim()) return;
      try { await appointmentService.reject(id, reason); load(); }
      catch (err) { Alert.alert('Error', err.message); }
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.role}>{ROLE_LABELS[user?.role]}</Text>
          <Text style={styles.name}>{user?.fullName}</Text>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: 'To Review', val: pending.length, color: colors.warning },
            { label: 'Upcoming', val: upcoming.length, color: colors.success },
            { label: 'Total', val: appointments.length, color: colors.primary },
          ].map((s) => (
            <View key={s.label} style={[styles.stat, { borderTopColor: s.color }]}>
              <Text style={[styles.statNum, { color: s.color }]}>{s.val}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        {pending.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏳ Awaiting Approval</Text>
            {pending.map((appt) => (
              <View key={appt.id}>
                <AppointmentCard appointment={appt} onPress={() => navigation.navigate('AppointmentDetails', { id: appt.id })} />
                <View style={styles.actions}>
                  <AppButton title="✅ Approve" onPress={() => approve(appt.id)} loading={actionLoading === appt.id} size="sm" style={styles.flex1} />
                  <AppButton title="❌ Reject" onPress={() => reject(appt.id)} variant="danger" size="sm" style={styles.flex1} />
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Upcoming Meetings</Text>
          {upcoming.length === 0
            ? <Text style={styles.empty}>No upcoming meetings</Text>
            : upcoming.map((a) => (
                <AppointmentCard key={a.id} appointment={a} onPress={() => navigation.navigate('AppointmentDetails', { id: a.id })} />
              ))
          }
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 24, paddingBottom: 8 },
  role: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  name: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginTop: 2 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 12 },
  stat: { flex: 1, backgroundColor: colors.bgCard, borderRadius: 12, padding: 12, alignItems: 'center', borderTopWidth: 2, borderWidth: 1, borderColor: colors.border },
  statNum: { fontSize: 24, fontWeight: '800' },
  statLbl: { fontSize: 11, color: colors.textSecondary },
  section: { paddingHorizontal: 20, paddingBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 16, marginTop: -4 },
  flex1: { flex: 1 },
  empty: { color: colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 20 },
});

export default LeaderDashboard;
