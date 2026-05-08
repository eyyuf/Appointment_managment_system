import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../theme/colors';
import { appointmentService } from '../../services/appointmentService';
import AppointmentCard from '../../components/cards/AppointmentCard';
import AppButton from '../../components/buttons/AppButton';

const SecretaryDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const loadPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getAll({ status: 'PENDING' });
      setPending(res.data.data.appointments || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadPending(); }, []);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await appointmentService.secretaryApprove(id, 'Reviewed and forwarded to leader');
      Alert.alert('✅ Forwarded', 'Appointment forwarded to leader for approval');
      loadPending();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally { setActionLoading(null); }
  };

  const handleReject = (id) => {
    Alert.prompt('Reject Appointment', 'Enter rejection reason:', async (reason) => {
      if (!reason?.trim()) return;
      setActionLoading(id);
      try {
        await appointmentService.reject(id, reason);
        loadPending();
      } catch (err) { Alert.alert('Error', err.message); }
      finally { setActionLoading(null); }
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadPending} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Secretary Dashboard</Text>
          <Text style={styles.sub}>Welcome, {user?.fullName}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.stat, { borderTopColor: colors.warning }]}>
            <Text style={[styles.statNum, { color: colors.warning }]}>{pending.length}</Text>
            <Text style={styles.statLbl}>Awaiting Review</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏳ Pending Requests</Text>
          {pending.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyText}>All caught up!</Text>
            </View>
          ) : (
            pending.map((appt) => (
              <View key={appt.id} style={styles.apptWrap}>
                <AppointmentCard
                  appointment={appt}
                  onPress={() => navigation.navigate('AppointmentDetails', { id: appt.id })}
                />
                <View style={styles.actions}>
                  <AppButton
                    title="✅ Forward"
                    onPress={() => handleApprove(appt.id)}
                    loading={actionLoading === appt.id}
                    size="sm"
                    style={styles.actionBtn}
                  />
                  <AppButton
                    title="❌ Reject"
                    onPress={() => handleReject(appt.id)}
                    variant="danger"
                    size="sm"
                    style={styles.actionBtn}
                  />
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 24, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  sub: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginVertical: 12 },
  stat: { flex: 1, backgroundColor: colors.bgCard, borderRadius: 12, padding: 16, alignItems: 'center', borderTopWidth: 3, borderWidth: 1, borderColor: colors.border },
  statNum: { fontSize: 28, fontWeight: '800' },
  statLbl: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  section: { paddingHorizontal: 20, paddingBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  apptWrap: { marginBottom: 4 },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  actionBtn: { flex: 1 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyText: { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
});

export default SecretaryDashboard;
