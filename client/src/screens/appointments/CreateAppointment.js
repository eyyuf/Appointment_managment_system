import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { appointmentService } from '../../services/appointmentService';
import { userService } from '../../services/notificationService';
import { colors } from '../../theme/colors';
import AppInput from '../../components/forms/AppInput';
import AppButton from '../../components/buttons/AppButton';
import { validateRequired, validateFutureDate, validateTimeRange } from '../../utils/validators';
import { ROLE_LABELS } from '../../utils/constants';

const today = new Date().toISOString().split('T')[0];

const CreateAppointment = ({ navigation }) => {
  const [leaders, setLeaders] = useState([]);
  const [loadingLeaders, setLoadingLeaders] = useState(true);
  const [slots, setSlots] = useState([]);
  const [slotsLoaded, setSlotsLoaded] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [form, setForm] = useState({
    leaderId: '', title: '', description: '', date: '', startTime: '', endTime: '', location: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    setLoadingLeaders(true);
    userService.getLeaders()
      .then((r) => setLeaders(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingLeaders(false));
  }, []);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const loadSlots = async (leaderId, date) => {
    if (!leaderId || !date) return;
    setLoadingSlots(true);
    setSlotsLoaded(false);
    setSlots([]);
    try {
      const res = await appointmentService.getAvailableSlots(leaderId, date);
      setSlots(res.data.data || []);
    } catch { setSlots([]); }
    finally { setLoadingSlots(false); setSlotsLoaded(true); }
  };

  const onLeaderSelect = (id) => {
    setForm((f) => ({ ...f, leaderId: id, startTime: '', endTime: '' }));
    setSlots([]);
    setSlotsLoaded(false);
    loadSlots(id, form.date);
  };

  const onDaySelect = (day) => {
    const date = day.dateString;
    setForm((f) => ({ ...f, date, startTime: '', endTime: '' }));
    setSlots([]);
    setSlotsLoaded(false);
    setShowCalendar(false);
    loadSlots(form.leaderId, date);
  };

  const selectSlot = (slot) => {
    setForm((f) => ({ ...f, startTime: slot.startTime, endTime: slot.endTime }));
  };

  const validate = () => {
    const e = {};
    if (!form.leaderId) e.leaderId = 'Please select a leader';
    const t = validateRequired(form.title, 'Title'); if (t) e.title = t;
    if (!form.date) e.date = 'Date is required';
    else { const d = validateFutureDate(form.date); if (d) e.date = d; }
    if (!form.startTime) e.startTime = 'Please select a time slot';
    if (form.startTime && form.endTime) {
      const tr = validateTimeRange(form.startTime, form.endTime); if (tr) e.time = tr;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await appointmentService.create(form);
      Alert.alert('Request Submitted', 'Your appointment request has been submitted successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Submission Failed', err.message || 'Could not create appointment');
    } finally { setLoading(false); }
  };

  const markedDates = form.date
    ? { [form.date]: { selected: true, selectedColor: colors.primary } }
    : {};

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>

            {/* ── Leader Selector ── */}
            <Text style={styles.sectionLabel}>
              Select Leader <Text style={styles.required}>*</Text>
            </Text>
            {loadingLeaders ? (
              <ActivityIndicator color={colors.primary} style={{ marginBottom: 16 }} />
            ) : leaders.length === 0 ? (
              <Text style={styles.emptyText}>No leaders available.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.leaderScroll}>
                {leaders.map((l) => (
                  <TouchableOpacity
                    key={l.id}
                    style={[styles.leaderChip, form.leaderId === l.id && styles.leaderChipActive]}
                    onPress={() => onLeaderSelect(l.id)}
                  >
                    <View style={[styles.avatarCircle, form.leaderId === l.id && styles.avatarCircleActive]}>
                      <Text style={[styles.avatarLetter, form.leaderId === l.id && styles.avatarLetterActive]}>
                        {l.fullName?.charAt(0)?.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.leaderName, form.leaderId === l.id && styles.leaderNameActive]} numberOfLines={2}>
                      {l.fullName}
                    </Text>
                    <Text style={styles.leaderRole}>{ROLE_LABELS[l.role]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            {errors.leaderId && <Text style={styles.errText}>{errors.leaderId}</Text>}

            {/* ── Title ── */}
            <AppInput
              label="Appointment Title *"
              value={form.title}
              onChangeText={set('title')}
              placeholder="e.g. Academic Advising"
              error={errors.title}
            />

            {/* ── Description ── */}
            <AppInput
              label="Description"
              value={form.description}
              onChangeText={set('description')}
              placeholder="Describe the purpose of this appointment..."
              multiline
              numberOfLines={3}
            />

            {/* ── Date Picker ── */}
            <Text style={styles.sectionLabel}>
              Date <Text style={styles.required}>*</Text>
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

            {/* ── Location ── */}
            <AppInput
              label="Location"
              value={form.location}
              onChangeText={set('location')}
              placeholder="e.g. Room 201, CS Building"
            />

            {/* ── Time Slots ── */}
            {!form.leaderId || !form.date ? (
              <Text style={styles.hintText}>
                Select a leader and date above to see available time slots.
              </Text>
            ) : (
              <View style={styles.slotsWrap}>
                <Text style={styles.sectionLabel}>
                  Available Time Slots <Text style={styles.required}>*</Text>
                </Text>
                {loadingSlots ? (
                  <ActivityIndicator color={colors.primary} size="small" style={{ marginBottom: 16 }} />
                ) : slots.length > 0 ? (
                  <View style={styles.slotsGrid}>
                    {slots.map((s) => (
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
                ) : slotsLoaded ? (
                  <Text style={styles.emptyText}>
                    No available slots for this date. Please choose another date.
                  </Text>
                ) : null}
              </View>
            )}
            {errors.startTime && <Text style={styles.errText}>{errors.startTime}</Text>}

            {/* ── Selected Time Summary ── */}
            {form.startTime ? (
              <View style={styles.selectedSlotBox}>
                <Text style={styles.selectedSlotLabel}>Selected Time</Text>
                <Text style={styles.selectedSlotValue}>{form.startTime} – {form.endTime}</Text>
              </View>
            ) : null}

            <AppButton title="Submit Request" onPress={handleSubmit} loading={loading} style={{ marginTop: 8 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Calendar Modal ── */}
      <Modal visible={showCalendar} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCalendar(false)}
        >
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20 },
  card: { backgroundColor: colors.bgCard, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border },
  sectionLabel: { fontSize: 13, fontWeight: '500', color: colors.textSecondary, marginBottom: 8 },
  required: { color: colors.error },
  leaderScroll: { marginBottom: 8 },
  leaderChip: {
    backgroundColor: colors.bgElevated, borderRadius: 12, padding: 12,
    marginRight: 10, alignItems: 'center', minWidth: 100,
    borderWidth: 1, borderColor: colors.border,
  },
  leaderChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgElevated,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
    borderWidth: 1, borderColor: colors.border,
  },
  avatarCircleActive: { backgroundColor: colors.primary + '33', borderColor: colors.primary },
  avatarLetter: { fontSize: 18, fontWeight: '700', color: colors.textMuted },
  avatarLetterActive: { color: colors.primary },
  leaderName: { fontSize: 12, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
  leaderNameActive: { color: colors.primary },
  leaderRole: { fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
  dateBtn: {
    backgroundColor: colors.bgInput, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 13, marginBottom: 4,
  },
  dateBtnError: { borderColor: colors.error },
  dateBtnText: { fontSize: 15, color: colors.textPrimary },
  datePlaceholder: { color: colors.textMuted },
  dropArrow: { fontSize: 11, color: colors.textMuted },
  slotsWrap: { marginBottom: 16 },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgElevated,
  },
  slotActive: { borderColor: colors.primary, backgroundColor: colors.primary + '22' },
  slotText: { fontSize: 12, color: colors.textSecondary },
  slotTextActive: { color: colors.primary, fontWeight: '600' },
  selectedSlotBox: {
    backgroundColor: colors.primary + '15', borderRadius: 10, padding: 12,
    marginBottom: 16, borderWidth: 1, borderColor: colors.primary + '40',
  },
  selectedSlotLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 2 },
  selectedSlotValue: { fontSize: 14, fontWeight: '600', color: colors.primary },
  errText: { fontSize: 12, color: colors.error, marginBottom: 8, marginTop: -2 },
  emptyText: { fontSize: 13, color: colors.textMuted, marginBottom: 16, fontStyle: 'italic' },
  hintText: { fontSize: 12, color: colors.textMuted, marginBottom: 16, fontStyle: 'italic' },
  modalOverlay: {
    flex: 1, backgroundColor: colors.overlay,
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  calendarModal: {
    backgroundColor: colors.bgCard, borderRadius: 20, overflow: 'hidden',
    width: '100%', borderWidth: 1, borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 16, fontWeight: '600', color: colors.textPrimary,
    textAlign: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
});

export default CreateAppointment;
