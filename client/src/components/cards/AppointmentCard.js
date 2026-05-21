import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import StatusBadge from './StatusBadge';
import { formatDate, formatTime } from '../../utils/dateFormatter';

const AppointmentCard = ({ appointment, onPress }) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { title, date, startTime, endTime, status, requester, leader } = appointment;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.flex1}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.people}>
            {requester?.fullName} {leader ? `→ ${leader.fullName}` : `[${appointment.targetDepartment}]`}
          </Text>
        </View>
        <StatusBadge status={status} />
      </View>
      <View style={styles.divider} />
      <View style={styles.footer}>
        <Text style={styles.metaIcon}>📅</Text>
        <Text style={styles.meta}>{formatDate(date)}</Text>
        <Text style={styles.metaIcon}> 🕐</Text>
        <Text style={styles.meta}>{formatTime(startTime)} – {formatTime(endTime)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const makeStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard, borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: colors.border,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  flex1: { flex: 1, marginRight: 8 },
  title: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  people: { fontSize: 12, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
  footer: { flexDirection: 'row', alignItems: 'center' },
  metaIcon: { fontSize: 12 },
  meta: { fontSize: 12, color: colors.textSecondary, marginRight: 8 },
});

export default AppointmentCard;
