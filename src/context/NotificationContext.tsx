import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useAuth } from './AuthContext';
import { type NotificationDto, getUnreadCount } from '../services/notificationService';

interface NotificationContextType {
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { token, isLoggedIn } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [connection, setConnection] = useState<HubConnection | null>(null);

  // Initial fetch
  useEffect(() => {
    if (isLoggedIn) {
      getUnreadCount().then(res => setUnreadCount(res.count ?? 0)).catch(() => {});
    } else {
      setUnreadCount(0);
    }
  }, [isLoggedIn]);

  // Handle SignalR connection
  useEffect(() => {
    if (isLoggedIn && token) {
      const newConnection = new HubConnectionBuilder()
        .withUrl('/hubs/notifications', {
          accessTokenFactory: () => token
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      setConnection(newConnection);

      return () => {
        newConnection.stop();
      };
    } else {
      setConnection(null);
    }
  }, [isLoggedIn, token]);

  // Set up listeners
  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          console.log('SignalR Connected');
          
          connection.on('ReceiveNotification', (notification: NotificationDto) => {
            console.log('Notification received:', notification);
            setUnreadCount(prev => prev + 1);
            
            // Optional: browser notification or toast could go here
            if (Notification.permission === 'granted') {
              new Notification('New Rant Notification', {
                body: notification.message,
              });
            }
          });
        })
        .catch(err => console.error('SignalR Connection Error: ', err));

      return () => {
        connection.off('ReceiveNotification');
      };
    }
  }, [connection]);

  // Request browser notification permission
  useEffect(() => {
    if (isLoggedIn && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [isLoggedIn]);

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}
