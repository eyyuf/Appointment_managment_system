import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '../../hooks/useNotifications';
import { colors } from '../../theme/colors';
import AppButton from '../../components/buttons/AppButton';
import { format } from 'date-fns';

const typeIcons = {
  APPOINTMENT_CREATED: '📨',
  APPOINTMENT_APPROVED: '✅',
  APPOINTMENT_REJECTED: '❌',
  APPOINTMENT_CANCELLED: '🚫',
  APPOINTMENT_RESCHEDULED: '🔄',
  APPOINTMENT_REMINDER: '⏰',
  GENERAL: '🔔',
};

const NotificationScreen = () => {
  const { notifications, unreadCount, loading, fetchNotifications, markRead, markAllRead } = useNotifications();

  useEffect(() => { fetchNotifications(); }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.item, !item.isRead && styles.itemUnread]}
      onPress={() => !item.isRead && markRead(item.id)}
      activeOpacity={0.8}
    >
      <Text style={styles.icon}>{typeIcons[item.type] || '🔔'}</Text>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          {!item.isRead && <View style={styles.dot} />}
        </View>
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.time}>{format(new Date(item.createdAt), 'MMM dd, HH:mm')}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Notifications</Text>
          {unreadCount > 0 && <Text style={styles.unread}>{unreadCount} unread</Text>}
        </View>
        {unreadCount > 0 && (
          <AppButton title="Mark All Read" onPress={markAllRead} variant="outline" size="sm" />
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchNotifications} tintColor={colors.primary} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔕</Text>
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  heading: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  unread: { fontSize: 13, color: colors.primary, fontWeight: '500', marginTop: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  item: { flexDirection: 'row', backgroundColor: colors.bgCard, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  itemUnread: { borderColor: colors.primary + '44', backgroundColor: colors.primary + '0A' },
  icon: { fontSize: 28, marginRight: 12, alignSelf: 'flex-start' },
  content: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginLeft: 6 },
  message: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  time: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 52, marginBottom: 12 },
  emptyText: { fontSize: 16, color: colors.textSecondary },
});

export default NotificationScreen;
