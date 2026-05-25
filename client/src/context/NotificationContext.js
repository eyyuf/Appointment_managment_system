import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
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
  const lastUnreadCountRef = useRef(null);
  const initializedRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  const fetchNotifications = useCallback(async (params = {}, options = {}) => {
    const { signalNew = false, silent = false } = options;
    if (!silent) setLoading(true);
    try {
      const res = await notificationService.getAll(params);
      const { notifications: list, unreadCount: count } = res.data.data;
      const latestId = list?.[0]?.id || null;

      const prevLatestId = latestIdRef.current;
      const prevUnread = lastUnreadCountRef.current;
      const hasNewById = Boolean(prevLatestId && latestId && latestId !== prevLatestId);
      const hasNewByCount = typeof prevUnread === 'number' && count > prevUnread;

      if (!initializedRef.current) {
        initializedRef.current = true;
        if (count > 0) setHasNewNotification(true);
      } else if (signalNew && (hasNewById || hasNewByCount)) {
        setHasNewNotification(true);
      }

      latestIdRef.current = latestId;
      lastUnreadCountRef.current = count;

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
    setUnreadCount((c) => {
      const next = Math.max(0, c - 1);
      lastUnreadCountRef.current = next;
      return next;
    });
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationService.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    lastUnreadCountRef.current = 0;
  }, []);

  const addNotification = useCallback((notif) => {
    setNotifications((prev) => [notif, ...prev]);
    setUnreadCount((c) => {
      const next = c + 1;
      lastUnreadCountRef.current = next;
      return next;
    });
    setHasNewNotification(true);
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
      lastUnreadCountRef.current = null;
      initializedRef.current = false;
      return;
    }

    fetchNotifications({}, { silent: true });
    const intervalId = setInterval(() => {
      fetchNotifications({}, { signalNew: true, silent: true });
    }, 10000);

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      const wasBackground = appStateRef.current === 'inactive' || appStateRef.current === 'background';
      if (wasBackground && nextState === 'active') {
        fetchNotifications({}, { signalNew: true, silent: true });
      }
      appStateRef.current = nextState;
    });

    return () => {
      clearInterval(intervalId);
      appStateSub.remove();
    };
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
