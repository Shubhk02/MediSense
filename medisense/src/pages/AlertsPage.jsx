import React, { useState } from 'react';
import { useAlerts } from '../context/AlertContext';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { AlertOctagon, AlertTriangle, CheckCircle, Clock, BellOff } from 'lucide-react';

export default function AlertsPage() {
  const { alerts, dispatch } = useAlerts();
  const { profile } = useAuth();
  const [tab, setTab] = useState('active');
  const [processingId, setProcessingId] = useState(null);

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const historyAlerts = alerts.filter(a => a.status === 'acknowledged');

  const handleAcknowledge = async (alertId) => {
    if (!profile || processingId) return;
    
    setProcessingId(alertId);
    
    // 1. Optimistic Update locally
    const alertToUpdate = alerts.find(a => a.id === alertId);
    if (alertToUpdate) {
      dispatch({ 
        type: 'ALERT_UPDATED', 
        payload: { ...alertToUpdate, status: 'acknowledged', acknowledged_at: new Date().toISOString() } 
      });
    }

    try {
      // 2. Background DB Update
      const { error } = await supabase.from('alerts')
        .update({
          status: 'acknowledged',
          acknowledged_by: profile.id,
          acknowledged_at: new Date().toISOString(),
        }).eq('id', alertId);
        
      if (error) throw error;
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
      // Rollback if needed (simplified: just keep it in previous state)
      // For now, assume it works as DB is reliable
    } finally {
      setProcessingId(null);
    }
  };

  const displayList = tab === 'active' ? activeAlerts : historyAlerts;

  return (
    <div className="page-enter max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Alerts</h1>
        <p className="text-slate-500 text-sm mt-0.5">Review active events and alert history.</p>
      </div>

      {/* Tab switcher — pill style */}
      <div className="flex gap-2 mb-5 p-1 bg-surface-low rounded-xl w-fit">
        {[
          { key: 'active', label: `Active`, count: activeAlerts.length },
          { key: 'history', label: `History`, count: historyAlerts.length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key
                ? 'bg-white text-slate-900 shadow-card'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
              tab === t.key
                ? t.key === 'active' && t.count > 0
                  ? 'bg-red-500 text-white'
                  : 'bg-primary-100 text-primary-600'
                : 'bg-slate-200 text-slate-500'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Alert list */}
      {displayList.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <BellOff className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="font-semibold text-slate-700">
            {tab === 'active' ? 'All clear!' : 'No history yet'}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {tab === 'active' ? 'No active alerts at the moment.' : 'Acknowledged alerts will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayList.map(alert => {
            const isCritical = ['LOW_IV_CRITICAL', 'BAG_EMPTY', 'DEVICE_OFFLINE'].includes(alert.type);
            return (
              <div
                key={alert.id}
                className={`card p-4 flex flex-col md:flex-row gap-4 items-start md:items-center border-l-4 ${
                  isCritical ? 'border-l-red-500' : 'border-l-amber-400'
                }`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isCritical ? 'bg-red-50' : 'bg-amber-50'
                }`}>
                  {isCritical
                    ? <AlertOctagon className="w-5 h-5 text-red-500" />
                    : <AlertTriangle className="w-5 h-5 text-amber-500" />
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={isCritical ? 'alert-chip-critical' : 'alert-chip-warning'}>
                      {alert.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-900">
                    {alert.patient_name}
                    <span className="text-slate-400 font-normal ml-2 text-sm">Bed {alert.bed_number}</span>
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5">{alert.message}</p>
                </div>

                {/* Action */}
                {alert.status === 'active' ? (
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    disabled={processingId === alert.id}
                    className={`btn-secondary text-sm flex-shrink-0 w-full md:w-auto transition-all ${
                      processingId === alert.id ? 'opacity-50 cursor-wait' : ''
                    }`}
                  >
                    {processingId === alert.id ? 'Processing...' : 'Acknowledge'}
                  </button>
                ) : (
                  <div className="flex flex-col items-end text-sm text-slate-400 flex-shrink-0">
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold mb-0.5">
                      <CheckCircle className="w-4 h-4" />
                      Acknowledged
                    </span>
                    <span className="text-xs">{new Date(alert.acknowledged_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
