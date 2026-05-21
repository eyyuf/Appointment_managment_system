import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { calendarService } from '../../services/notificationService';
import { useTheme } from '../../context/ThemeContext';
import { formatTime } from '../../utils/dateFormatter';
import { toISODate } from '../../utils/dateFormatter';

const CalendarScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const today = toISODate(new Date());
  const [selected, setSelected] = useState(today);
  const [appointments, setAppointments] = useState([]);
  const [dayAppts, setDayAppts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const loadMonth = useCallback(async (date) => {
    setLoading(true);
    try {
      const res = await calendarService.getMonthly(date.getFullYear(), date.getMonth() + 1);
      setAppointments(res.data.data || []);
    } catch { }
    finally { setLoading(false); }
  }, []);

  const loadDay = useCallback(async (date) => {
    try {
      const res = await calendarService.getDay(date);
      setDayAppts(res.data.data || []);
    } catch { setDayAppts([]); }
  }, []);

  useFocusEffect(useCallback(() => {
    loadMonth(currentMonth);
    loadDay(today);
  }, []));

  const handleDayPress = (day) => {
    setSelected(day.dateString);
    loadDay(day.dateString);
  };

  const handleMonthChange = (month) => {
    const d = new Date(month.year, month.month - 1, 1);
    setCurrentMonth(d);
    loadMonth(d);
  };

  // Build marked dates for the calendar
  const markedDates = {};
  appointments.forEach((a) => {
    const d = toISODate(new Date(a.date));
    const dot = { color: statusColors[a.status] || colors.primary };
    if (!markedDates[d]) markedDates[d] = { dots: [dot] };
    else markedDates[d].dots.push(dot);
  });
  markedDates[selected] = { ...(markedDates[selected] || {}), selected: true, selectedColor: colors.primary };

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { loadMonth(currentMonth); loadDay(selected); }} tintColor={colors.primary} />}
      >
        <Text style={styles.heading}>📅 Calendar</Text>

        <Calendar
          current={today}
          onDayPress={handleDayPress}
          onMonthChange={handleMonthChange}
          markedDates={markedDates}
          markingType="multi-dot"
          theme={{
            backgroundColor: colors.bgCard,
            calendarBackground: colors.bgCard,
            textSectionTitleColor: colors.textSecondary,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: colors.white,
            todayTextColor: colors.primary,
            dayTextColor: colors.textPrimary,
            textDisabledColor: colors.textMuted,
            dotColor: colors.primary,
            arrowColor: colors.primary,
            monthTextColor: colors.textPrimary,
            textMonthFontWeight: '700',
            textDayFontSize: 14,
            textMonthFontSize: 16,
          }}
          style={styles.calendar}
        />

        <View style={styles.section}>
          <Text style={styles.dayTitle}>
            {selected === today ? "Today's Schedule" : `Schedule for ${selected}`}
          </Text>
          {dayAppts.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🗓️</Text>
              <Text style={styles.emptyText}>No appointments on this day</Text>
            </View>
          ) : (
            dayAppts.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={[styles.apptItem, { borderLeftColor: statusColors[a.status] || colors.primary }]}
                onPress={() => navigation.navigate('AppointmentDetails', { id: a.id })}
              >
                <Text style={styles.apptTime}>{formatTime(a.startTime)} – {formatTime(a.endTime)}</Text>
                <Text style={styles.apptTitle}>{a.title}</Text>
                <Text style={styles.apptPerson}>{a.requester?.fullName} → {a.leader?.fullName}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  heading: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, padding: 20, paddingBottom: 12 },
  calendar: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  section: { padding: 20 },
  dayTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  apptItem: { backgroundColor: colors.bgCard, borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 4, borderWidth: 1, borderColor: colors.border },
  apptTime: { fontSize: 12, color: colors.primary, fontWeight: '600', marginBottom: 4 },
  apptTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  apptPerson: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.textMuted },
});

export default CalendarScreen;
