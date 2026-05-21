import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appointmentService } from '../../services/appointmentService';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import AppointmentCard from '../../components/cards/AppointmentCard';
import { APPOINTMENT_STATUSES, STATUS_LABELS } from '../../utils/constants';

const AppointmentHistory = ({ navigation }) => {
  const { colors } = useTheme();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter ? { status: filter, limit: 50 } : { limit: 50 };
      const res = await appointmentService.getAll(params);
      setAppointments(res.data.data.appointments || []);
    } catch { }
    finally { setLoading(false); }
  }, [filter]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.filters}>
        <TouchableOpacity style={[styles.chip, !filter && styles.chipActive]} onPress={() => setFilter('')}>
          <Text style={[styles.chipTxt, !filter && styles.chipTxtActive]}>All</Text>
        </TouchableOpacity>
        {APPOINTMENT_STATUSES.map((s) => (
          <TouchableOpacity key={s} style={[styles.chip, filter === s && styles.chipActive]} onPress={() => setFilter(s)}>
            <Text style={[styles.chipTxt, filter === s && styles.chipTxtActive]}>{STATUS_LABELS[s]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={appointments}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No appointments found</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <AppointmentCard
            appointment={item}
            onPress={() => navigation.navigate('AppointmentDetails', { id: item.id })}
          />
        )}
      />
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  filters: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgElevated },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
  chipTxt: { fontSize: 12, color: colors.textSecondary },
  chipTxtActive: { color: colors.primary, fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: colors.textSecondary },
});

export default AppointmentHistory;
