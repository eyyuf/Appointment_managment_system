import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, statusColors } from '../../theme/colors';
import { STATUS_LABELS } from '../../utils/constants';

const StatusBadge = ({ status, size = 'sm' }) => {
  const color = statusColors[status] || colors.textMuted;
  const label = STATUS_LABELS[status] || status;
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '44' }, styles[size]]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }, size === 'lg' && styles.textLg]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  sm: {},
  lg: { paddingHorizontal: 12, paddingVertical: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  text: { fontSize: 12, fontWeight: '600' },
  textLg: { fontSize: 14 },
});

export default StatusBadge;
