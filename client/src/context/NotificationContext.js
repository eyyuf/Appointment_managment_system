import React, { createContext, useState, useCallback } from 'react';
import { notificationService } from '../services/notificationService';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await notificationService.getAll(params);
      const { notifications: list, unreadCount: count } = res.data.data;
      setNotifications(list);
      setUnreadCount(count);
    } catch {}
    finally { setLoading(false); }
  }, []);

  const markRead = useCallback(async (id) => {
    await notificationService.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationService.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const addNotification = useCallback((notif) => {
    setNotifications((prev) => [notif, ...prev]);
    setUnreadCount((c) => c + 1);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, loading,
      fetchNotifications, markRead, markAllRead, addNotification,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
