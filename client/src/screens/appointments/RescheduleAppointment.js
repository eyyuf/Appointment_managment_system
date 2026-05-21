import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appointmentService } from '../../services/appointmentService';
import { useTheme } from '../../context/ThemeContext';
import AppInput from '../../components/forms/AppInput';
import AppButton from '../../components/buttons/AppButton';
import { formatDate, formatTime } from '../../utils/dateFormatter';

const RescheduleAppointment = ({ route, navigation }) => {
  const { id, appointment } = route.params;
  const { colors } = useTheme();
  const [form, setForm] = useState({ newDate: '', newStartTime: '', newEndTime: '', reason: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.newDate) e.newDate = 'New date is required';
    if (!form.newStartTime) e.newStartTime = 'Start time required (HH:MM)';
    if (!form.newEndTime) e.newEndTime = 'End time required (HH:MM)';
    if (form.newEndTime && form.newStartTime && form.newEndTime <= form.newStartTime) e.newEndTime = 'End must be after start';
    if (!form.reason.trim()) e.reason = 'Reason is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await appointmentService.reschedule(id, form);
      Alert.alert('✅ Submitted', 'Reschedule request sent', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setLoading(false); }
  };

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.currentCard}>
            <Text style={styles.currentTitle}>Current Schedule</Text>
            <Text style={styles.currentVal}>📅 {formatDate(appointment?.date)}</Text>
            <Text style={styles.currentVal}>🕐 {formatTime(appointment?.startTime)} – {formatTime(appointment?.endTime)}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>New Schedule</Text>
            <AppInput label="New Date *" value={form.newDate} onChangeText={set('newDate')} placeholder="YYYY-MM-DD" error={errors.newDate} />
            <AppInput label="New Start Time *" value={form.newStartTime} onChangeText={set('newStartTime')} placeholder="HH:MM (e.g. 10:00)" error={errors.newStartTime} />
            <AppInput label="New End Time *" value={form.newEndTime} onChangeText={set('newEndTime')} placeholder="HH:MM (e.g. 10:30)" error={errors.newEndTime} />
            <AppInput label="Reason *" value={form.reason} onChangeText={set('reason')} placeholder="Why do you need to reschedule?" multiline numberOfLines={3} error={errors.reason} />
            <AppButton title="Submit Reschedule Request" onPress={handleSubmit} loading={loading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20 },
  currentCard: { backgroundColor: colors.bgElevated, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  currentTitle: { fontSize: 12, color: colors.textMuted, marginBottom: 8, fontWeight: '600' },
  currentVal: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  card: { backgroundColor: colors.bgCard, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
});

export default RescheduleAppointment;
