import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { appointmentService } from '../../services/appointmentService';
import { useTheme } from '../../context/ThemeContext';
import AppInput from '../../components/forms/AppInput';
import AppButton from '../../components/buttons/AppButton';

const today = new Date().toISOString().split('T')[0];

const TIME_SLOTS = [
  { startTime: '08:00', endTime: '08:30' },
  { startTime: '08:30', endTime: '09:00' },
  { startTime: '09:00', endTime: '09:30' },
  { startTime: '09:30', endTime: '10:00' },
  { startTime: '10:00', endTime: '10:30' },
  { startTime: '10:30', endTime: '11:00' },
  { startTime: '11:00', endTime: '11:30' },
  { startTime: '11:30', endTime: '12:00' },
  { startTime: '13:00', endTime: '13:30' },
  { startTime: '13:30', endTime: '14:00' },
  { startTime: '14:00', endTime: '14:30' },
  { startTime: '14:30', endTime: '15:00' },
  { startTime: '15:00', endTime: '15:30' },
  { startTime: '15:30', endTime: '16:00' },
];

const CreateAppointment = ({ navigation }) => {
  const { colors } = useTheme();
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [form, setForm] = useState({
    targetDepartment: '',
    title: '',
    reason: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    appointmentService.getDepartments()
      .then((r) => setDepartments(r.data.data || []))
      .catch(() => setDepartments([]))
      .finally(() => setLoadingDepts(false));
  }, []);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const onDaySelect = (day) => {
    setForm((f) => ({ ...f, date: day.dateString, startTime: '', endTime: '' }));
    setShowCalendar(false);
  };

  const selectSlot = (slot) => {
    setForm((f) => ({ ...f, startTime: slot.startTime, endTime: slot.endTime }));
  };

  const validate = () => {
    const e = {};
    if (!form.targetDepartment) e.targetDepartment = 'Please select a department';
    if (!form.title.trim() || form.title.trim().length < 3) e.title = 'Title must be at least 3 characters';
    if (!form.reason.trim() || form.reason.trim().length < 10) e.reason = 'Please provide a detailed reason (min 10 chars)';
    if (!form.date) e.date = 'Please select a date';
    if (!form.startTime) e.startTime = 'Please select a time slot';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await appointmentService.create(form);
      Alert.alert(
        'Request Submitted',
        'Your appointment request has been submitted to the Secretary for review. You will be notified of the outcome.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Submission Failed', err.message || 'Could not submit request');
    } finally { setLoading(false); }
  };

  const markedDates = form.date
    ? { [form.date]: { selected: true, selectedColor: colors.primary } }
    : {};

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Workflow Banner */}
          <View style={styles.infoBanner}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              Your request will be reviewed by the Secretary before being forwarded to the appropriate leader.
            </Text>
          </View>

          <View style={styles.card}>
            {/* Department Selection */}
            <Text style={styles.sectionLabel}>
              Department / Office <Text style={styles.required}>*</Text>
            </Text>
            {loadingDepts ? (
              <ActivityIndicator color={colors.primary} style={{ marginBottom: 16 }} />
            ) : departments.length === 0 ? (
              <Text style={styles.emptyText}>No departments available.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptScroll}>
                {departments.map((dept) => (
                  <TouchableOpacity
                    key={dept}
                    style={[styles.deptChip, form.targetDepartment === dept && styles.deptChipActive]}
                    onPress={() => set('targetDepartment')(dept)}
                  >
                    <Text style={[styles.deptChipText, form.targetDepartment === dept && styles.deptChipTextActive]}>
                      {dept}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            {errors.targetDepartment && <Text style={styles.errText}>{errors.targetDepartment}</Text>}

            {/* Title */}
            <AppInput
              label="Appointment Title *"
              value={form.title}
              onChangeText={set('title')}
              placeholder="e.g. Academic Advising"
              error={errors.title}
            />

            {/* Reason (required) */}
            <AppInput
              label="Reason for Appointment *"
              value={form.reason}
              onChangeText={set('reason')}
              placeholder="Describe the purpose and reason for this appointment request..."
              multiline
              numberOfLines={4}
              error={errors.reason}
            />

            {/* Additional Description */}
            <AppInput
              label="Additional Details (optional)"
              value={form.description}
              onChangeText={set('description')}
              placeholder="Any supporting details..."
              multiline
              numberOfLines={2}
            />

            {/* Date Picker */}
            <Text style={styles.sectionLabel}>
              Preferred Date <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.dateBtn, errors.date && styles.dateBtnError]}
              onPress={() => setShowCalendar(true)}
            >
              <Text style={[styles.dateBtnText, !form.date && styles.datePlaceholder]}>
                {form.date || 'Select a date'}
              </Text>
              <Text style={styles.dropArrow}>▼</Text>
            </TouchableOpacity>
            {errors.date && <Text style={styles.errText}>{errors.date}</Text>}

            {/* Location */}
            <AppInput
              label="Preferred Location (optional)"
              value={form.location}
              onChangeText={set('location')}
              placeholder="e.g. Room 201, CS Building"
            />

            {/* Time Slots */}
            <Text style={styles.sectionLabel}>
              Preferred Time Slot <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.hintText}>Note: The secretary may adjust the time when forwarding to the leader.</Text>
            <View style={styles.slotsGrid}>
              {TIME_SLOTS.map((s) => (
                <TouchableOpacity
                  key={s.startTime}
                  style={[styles.slot, form.startTime === s.startTime && styles.slotActive]}
                  onPress={() => selectSlot(s)}
                >
                  <Text style={[styles.slotText, form.startTime === s.startTime && styles.slotTextActive]}>
                    {s.startTime} – {s.endTime}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.startTime && <Text style={styles.errText}>{errors.startTime}</Text>}

            {form.startTime ? (
              <View style={styles.selectedSlotBox}>
                <Text style={styles.selectedSlotLabel}>Selected Time</Text>
                <Text style={styles.selectedSlotValue}>{form.startTime} – {form.endTime}</Text>
              </View>
            ) : null}

            <AppButton title="Submit Request" onPress={handleSubmit} loading={loading} style={{ marginTop: 12 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Calendar Modal */}
      <Modal visible={showCalendar} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCalendar(false)}>
          <View style={styles.calendarModal}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <Calendar
              minDate={today}
              markedDates={markedDates}
              onDayPress={onDaySelect}
              theme={{
                backgroundColor: colors.bgCard,
                calendarBackground: colors.bgCard,
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: colors.white,
                todayTextColor: colors.primary,
                dayTextColor: colors.textPrimary,
                textDisabledColor: colors.textMuted,
                arrowColor: colors.primary,
                monthTextColor: colors.textPrimary,
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 32 },
  infoBanner: {
    flexDirection: 'row', backgroundColor: colors.primary + '15',
    borderRadius: 12, padding: 12, marginBottom: 16, gap: 8,
    borderWidth: 1, borderColor: colors.primary + '30',
    alignItems: 'flex-start',
  },
  infoIcon: { fontSize: 16, marginTop: 1 },
  infoText: { flex: 1, fontSize: 12, color: colors.primary, lineHeight: 18 },
  card: { backgroundColor: colors.bgCard, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border },
  sectionLabel: { fontSize: 13, fontWeight: '500', color: colors.textSecondary, marginBottom: 8 },
  required: { color: colors.error },
  deptScroll: { marginBottom: 8 },
  deptChip: {
    backgroundColor: colors.bgElevated, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    marginRight: 8, borderWidth: 1, borderColor: colors.border,
  },
  deptChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
  deptChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  deptChipTextActive: { color: colors.primary, fontWeight: '700' },
  dateBtn: {
    backgroundColor: colors.bgInput || colors.bgElevated, borderRadius: 12, borderWidth: 1,
    borderColor: colors.border, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 13, marginBottom: 4,
  },
  dateBtnError: { borderColor: colors.error },
  dateBtnText: { fontSize: 15, color: colors.textPrimary },
  datePlaceholder: { color: colors.textMuted },
  dropArrow: { fontSize: 11, color: colors.textMuted },
  hintText: { fontSize: 11, color: colors.textMuted, marginBottom: 10, fontStyle: 'italic' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  slot: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgElevated,
  },
  slotActive: { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
  slotText: { fontSize: 12, color: colors.textSecondary },
  slotTextActive: { color: colors.primary, fontWeight: '600' },
  selectedSlotBox: {
    backgroundColor: colors.primary + '15', borderRadius: 10, padding: 12,
    marginBottom: 12, borderWidth: 1, borderColor: colors.primary + '40',
  },
  selectedSlotLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 2 },
  selectedSlotValue: { fontSize: 14, fontWeight: '600', color: colors.primary },
  errText: { fontSize: 12, color: colors.error, marginBottom: 8, marginTop: -4 },
  emptyText: { fontSize: 13, color: colors.textMuted, marginBottom: 16, fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  calendarModal: { backgroundColor: colors.bgCard, borderRadius: 20, overflow: 'hidden', width: '100%', borderWidth: 1, borderColor: colors.border },
  modalTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, textAlign: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
});

export default CreateAppointment;
