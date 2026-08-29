'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { updateFcmToken } from '@/lib/services/users';

interface NotificationContextType {
  fcmToken: string | null;
  permission: NotificationPermission;
  isEnabled: boolean;
  requestPermission: () => Promise<void>;
  toggleNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [fcmToken, _setFcmToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      const stored = localStorage.getItem('mudmy_notifications_enabled');
      setIsEnabled(stored !== 'false');
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        setIsEnabled(true);
        localStorage.setItem('mudmy_notifications_enabled', 'true');
        // NOTE: FCM-based push notifications have been stubbed.
        // To re-enable push notifications, integrate a service like
        // OneSignal, Novu, or Web Push API here.
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const toggleNotifications = async () => {
    const nextState = !isEnabled;
    setIsEnabled(nextState);
    localStorage.setItem('mudmy_notifications_enabled', String(nextState));

    if (!nextState && user) {
      // Clear FCM token from DB when disabling
      await updateFcmToken(user.id, null);
    }
  };

  return (
    <NotificationContext.Provider value={{ fcmToken, permission, isEnabled, requestPermission, toggleNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}
