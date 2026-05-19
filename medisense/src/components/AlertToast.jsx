import React, { useEffect } from 'react';
import { useAlerts } from '../context/AlertContext';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { AlertOctagon, AlertTriangle, X } from 'lucide-react';

export default function AlertToast() {
  const { recentToasts, dispatch } = useAlerts();
  const { profile } = useAuth();

  const handleAcknowledge = async (alertId) => {
    if (!profile) return;
    await supabase.from('alerts')
      .update({
        status: 'acknowledged',
        acknowledged_by: profile.id,
        acknowledged_at: new Date().toISOString()
      }).eq('id', alertId);
    
    dispatch({ type: 'DISMISS_TOAST', payload: alertId });
  };

  if (!recentToasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3">
      {recentToasts.map((toast) => {
        const isCritical = ['LOW_IV_CRITICAL', 'BAG_EMPTY', 'DEVICE_OFFLINE'].includes(toast.type);
        
        return (
          <div
            key={toast.id}
            className={`bg-white rounded-2xl shadow-card-md border-l-4 w-80 p-4 flex items-start gap-3 ${
              isCritical ? 'border-red-500' : 'border-amber-400'
            }`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isCritical ? 'bg-red-50' : 'bg-amber-50'}`}>
              {isCritical
                ? <AlertOctagon className="text-red-500 w-4 h-4" />
                : <AlertTriangle className="text-amber-500 w-4 h-4" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 text-sm truncate">
                {toast.patient_name} · Bed {toast.bed_number}
              </p>
              <p className="text-slate-500 text-xs mt-0.5 mb-2.5 leading-snug">{toast.message}</p>
              <button
                onClick={() => handleAcknowledge(toast.id)}
                className="text-xs font-semibold bg-primary-50 text-primary-600 hover:bg-primary-100 transition px-2.5 py-1 rounded-lg"
              >
                Acknowledge
              </button>
            </div>
            <button
              onClick={() => dispatch({ type: 'DISMISS_TOAST', payload: toast.id })}
              className="text-slate-300 hover:text-slate-500 transition flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
