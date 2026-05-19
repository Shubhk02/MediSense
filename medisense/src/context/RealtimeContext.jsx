import React, { createContext, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useWard } from './WardContext';
import { useAlerts } from './AlertContext';

const RealtimeContext = createContext({});

export const RealtimeProvider = ({ children }) => {
  const { dispatch: wardDispatch } = useWard();
  const { dispatch: alertDispatch } = useAlerts();

  useEffect(() => {
    // Subscribe to new readings
    const readingsChannel = supabase.channel('readings-live')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'readings'
      }, (payload) => {
        wardDispatch({ type: 'READING_UPDATE', payload: payload.new });
      })
      .subscribe();

    // Subscribe to alerts
    const alertsChannel = supabase.channel('alerts-live')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'alerts'
      }, (payload) => {
        alertDispatch({ type: 'ALERT_FIRED', payload: payload.new });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'alerts'
      }, (payload) => {
        alertDispatch({ type: 'ALERT_UPDATED', payload: payload.new });
      })
      .subscribe();

    // Subscribe to devices
    const devicesChannel = supabase.channel('devices-live')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'devices'
      }, (payload) => {
        wardDispatch({ type: 'DEVICE_STATUS_CHANGE', payload: payload.new });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(readingsChannel);
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(devicesChannel);
    };
  }, [wardDispatch, alertDispatch]);

  return (
    <RealtimeContext.Provider value={{}}>
      {children}
    </RealtimeContext.Provider>
  );
};
