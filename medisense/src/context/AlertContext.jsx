import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { useWard } from './WardContext';
import { useAuth } from './AuthContext';

const AlertContext = createContext({});

const initialState = {
  alerts: [],
  recentToasts: []
};

function alertReducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return { ...state, alerts: action.payload };
    case 'ALERT_FIRED':
      return {
        ...state,
        alerts: [action.payload, ...state.alerts],
        recentToasts: [...state.recentToasts, action.payload]
      };
    case 'ALERT_UPDATED':
      return {
        ...state,
        // Keep active and acknowledged alerts for the history view
        alerts: state.alerts
          .map(a => a.id === action.payload.id ? action.payload : a)
          .filter(a => ['active', 'acknowledged'].includes(a.status))
      };
    case 'DISMISS_TOAST':
      return {
        ...state,
        recentToasts: state.recentToasts.filter(t => t.id !== action.payload)
      };
    default:
      return state;
  }
}

export const AlertProvider = ({ children }) => {
  const [state, dispatch] = useReducer(alertReducer, initialState);

  useEffect(() => {
    const fetchAlerts = async () => {
      // Join with patients so we can filter out discharged patients
      const { data } = await supabase
        .from('alerts')
        .select('*, patients!inner(status)')
        .in('status', ['active', 'acknowledged'])
        .neq('patients.status', 'discharged')
        .order('created_at', { ascending: false });

      if (data) {
        dispatch({ type: 'INIT', payload: data });
      }
    };
    fetchAlerts();

    // Realtime subscription — listen for alert changes
    const channel = supabase
      .channel('alerts_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'alerts',
      }, async (payload) => {
        // Only show alert if patient is not discharged
        const { data: patient } = await supabase
          .from('patients')
          .select('status')
          .eq('id', payload.new.patient_id)
          .single();

        if (patient?.status !== 'discharged') {
          dispatch({ type: 'ALERT_FIRED', payload: payload.new });
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'alerts',
      }, (payload) => {
        dispatch({ type: 'ALERT_UPDATED', payload: payload.new });
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // ── CLINICAL WATCHDOG (Frontend Reliability Layer) ──
  const { readings, patients, devices } = useWard();
  const { profile } = useAuth();
  const prevReadings = useRef({});

  useEffect(() => {
    // Only fire alerts if we are an authorized staff member (prevent duplicates from patients)
    if (!profile || !['admin', 'nurse'].includes(profile.role)) return;
    if (!readings) return;

    Object.entries(readings).forEach(async ([patientId, reading]) => {
      const prev = prevReadings.current[patientId];
      if (!prev || prev.timestamp === reading.timestamp) return;

      const patient = patients.find(p => p.id === patientId);
      const device = devices.find(d => d.patient_id === patientId);
      if (!patient || !device) return;

      // 1. Sudden Weight Drop Check
      const deltaGrams = prev.weight_grams - reading.weight_grams;
      // Sensitivity threshold: 50g
      if (deltaGrams >= 50) {
        const hasActive = state.alerts.some(a => a.patient_id === patientId && a.type === 'SUDDEN_WEIGHT_DROP' && a.status === 'active');
        if (!hasActive) {
          await supabase.from('alerts').insert({
            patient_id: patientId,
            patient_name: patient.name,
            bed_number: device.bed_number,
            type: 'SUDDEN_WEIGHT_DROP',
            message: `SUDDEN DROP: Weight decreased by ${deltaGrams.toFixed(0)}g instantly. Check for leaks/disconnects.`,
            percentage: reading.percentage,
            status: 'active'
          });
          // Also set patient to critical
          await supabase.from('patients').update({ status: 'critical' }).eq('id', patientId);
        }
      }

      // 2. Drip Rate Anomaly (when prescribed is 0)
      if (patient.prescribed_drip_rate_ml_hr === 0 && reading.drip_rate_ml_hr > 10) {
        const hasActive = state.alerts.some(a => a.patient_id === patientId && a.type === 'DRIP_RATE_ANOMALY' && a.status === 'active');
        if (!hasActive) {
          await supabase.from('alerts').insert({
            patient_id: patientId,
            patient_name: patient.name,
            bed_number: device.bed_number,
            type: 'DRIP_RATE_ANOMALY',
            message: `UNEXPECTED FLOW: Drip running (${reading.drip_rate_ml_hr.toFixed(0)} ml/hr) but prescription is 0.`,
            percentage: reading.percentage,
            status: 'active'
          });
        }
      }
    });

    // Update history
    prevReadings.current = { ...readings };
  }, [readings, patients, profile, state.alerts]);

  return (
    <AlertContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => useContext(AlertContext);
