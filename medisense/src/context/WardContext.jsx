import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from './AuthContext';

const WardContext = createContext({});

const initialState = {
  patients: [],
  devices: [],
  readings: {}, // patient_id -> latest reading
  sessions: {}, // patient_id -> active session
  loading: true,
  error: null,
};

function wardReducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return { ...state, ...action.payload, loading: false, error: null };
    case 'LOADING':
      return { ...state, loading: true };
    case 'ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'READING_UPDATE':
      if (!action.payload.patient_id) return state;
      return {
        ...state,
        readings: { ...state.readings, [action.payload.patient_id]: action.payload },
      };
    case 'READINGS_BATCH':
      return {
        ...state,
        readings: { ...state.readings, ...action.payload },
      };
    case 'DEVICE_STATUS_CHANGE':
      return {
        ...state,
        devices: state.devices.map(d =>
          d.device_id === action.payload.device_id ? { ...d, ...action.payload } : d
        ),
      };
    case 'PATIENT_PATCH':
      return {
        ...state,
        patients: state.patients.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload } : p
        ),
      };
    case 'SESSION_PATCH':
      return {
        ...state,
        sessions: { 
          ...state.sessions, 
          [action.payload.patient_id]: { ...(state.sessions[action.payload.patient_id] || {}), ...action.payload } 
        },
      };
    case 'SESSION_REMOVE':
      const newSessions = { ...state.sessions };
      delete newSessions[action.payload];
      return { ...state, sessions: newSessions };
    default:
      return state;
  }
}

export const WardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(wardReducer, initialState);
  const { user } = useAuth();

  const fetchReadings = useCallback(async () => {
    if (!state.patients.length) return;
    const patientIds = state.patients.map(p => p.id);
    
    // Fetch latest reading per patient (lightweight)
    const readingPromises = patientIds.map(pid =>
      supabase
        .from('readings')
        .select('*')
        .eq('patient_id', pid)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle()
    );
    
    const results = await Promise.all(readingPromises);
    const newReadings = {};
    results.forEach((res, i) => {
      if (res.data) newReadings[patientIds[i]] = res.data;
    });
    
    dispatch({ type: 'READINGS_BATCH', payload: newReadings });
  }, [state.patients]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    // Use loading state only for initial fetch
    if (state.loading) dispatch({ type: 'LOADING' });

    try {
      const [patientsRes, devicesRes, sessionsRes] = await Promise.all([
        supabase.from('patients').select('*').neq('status', 'discharged').order('bed_number'),
        supabase.from('devices').select('*'),
        supabase.from('sessions').select('*').eq('status', 'active'),
      ]);

      if (patientsRes.error) throw patientsRes.error;

      const patients = patientsRes.data || [];
      const devices = devicesRes.data || [];

      const sessions = {};
      (sessionsRes.data || []).forEach(s => { sessions[s.patient_id] = s; });

      // Fetch latest reading per patient in one batch query using a subquery approach
      const readings = {};
      if (patients.length > 0) {
        const patientIds = patients.map(p => p.id);
        // Fetch the latest reading for each patient via a single query per patient (batched)
        const readingPromises = patientIds.map(pid =>
          supabase
            .from('readings')
            .select('*')
            .eq('patient_id', pid)
            .order('timestamp', { ascending: false })
            .limit(1)
            .maybeSingle()
        );
        const readingResults = await Promise.all(readingPromises);
        readingResults.forEach((res, i) => {
          if (res.data) readings[patientIds[i]] = res.data;
        });
      }

      dispatch({ type: 'INIT', payload: { patients, devices, sessions, readings } });
    } catch (err) {
      console.error('WardContext fetchData error:', err);
      dispatch({ type: 'ERROR', payload: err.message });
      // Still clear loading even on error
      dispatch({ type: 'INIT', payload: { patients: [], devices: [], sessions: {}, readings: {} } });
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription for new readings
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('ward-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'readings' },
        (payload) => {
          dispatch({ type: 'READING_UPDATE', payload: payload.new });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'devices' },
        (payload) => {
          dispatch({ type: 'DEVICE_STATUS_CHANGE', payload: payload.new });
        }
      )
      // Dynamic updates without full blinking reload
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patients' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            fetchData(); // Simplest to full refresh for layout shifts
          } else if (payload.eventType === 'INSERT') {
            fetchData();
          } else {
            dispatch({ type: 'PATIENT_PATCH', payload: payload.new });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new.status === 'active') {
            dispatch({ type: 'SESSION_PATCH', payload: payload.new });
          } else if (payload.eventType === 'UPDATE' && payload.new.status !== 'active') {
             dispatch({ type: 'SESSION_REMOVE', payload: payload.new.patient_id });
          } else {
            fetchData();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Polling fallback — ensures updates even if realtime fails
  useEffect(() => {
    if (!user || !state.patients.length) return;

    const interval = setInterval(() => {
      fetchReadings();
    }, 2000); // 2 second fallback

    return () => clearInterval(interval);
  }, [user, state.patients.length, fetchReadings]);

  const getAvailableBeds = useCallback(() => {
    const occupied = state.patients.map(p => p.bed_number);
    return Array.from({ length: 10 }, (_, i) => i + 1).filter(b => !occupied.includes(b));
  }, [state.patients]);

  return (
    <WardContext.Provider value={{ ...state, refetch: fetchData, getAvailableBeds, dispatch }}>
      {children}
    </WardContext.Provider>
  );
};

export const useWard = () => useContext(WardContext);
