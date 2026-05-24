import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../hooks/useAuth';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const latestIdRef = useRef(null);
  const initializedRef = useRef(false);

  const fetchNotifications = useCallback(async (params = {}, options = {}) => {
    const { signalNew = false, silent = false } = options;
    if (!silent) setLoading(true);
    try {
      const res = await notificationService.getAll(params);
      const { notifications: list, unreadCount: count } = res.data.data;
      const latestId = list?.[0]?.id || null;

      if (!initializedRef.current) {
        initializedRef.current = true;
        latestIdRef.current = latestId;
      } else if (signalNew && latestId && latestId !== latestIdRef.current) {
        setHasNewNotification(true);
        latestIdRef.current = latestId;
      } else if (latestId) {
        latestIdRef.current = latestId;
      }

      setNotifications(list);
      setUnreadCount(count);
    } catch {}
    finally { if (!silent) setLoading(false); }
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

  const clearNewIndicator = useCallback(() => {
    setHasNewNotification(false);
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setHasNewNotification(false);
      latestIdRef.current = null;
      initializedRef.current = false;
      return;
    }

    fetchNotifications({}, { silent: true });
    const intervalId = setInterval(() => {
      fetchNotifications({}, { signalNew: true, silent: true });
    }, 10000);

    return () => clearInterval(intervalId);
  }, [user, fetchNotifications]);

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, loading, hasNewNotification,
      fetchNotifications, markRead, markAllRead, addNotification,
      clearNewIndicator,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
