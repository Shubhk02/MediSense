import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import IVGauge from './IVGauge';
import { WifiOff, Plus, X, Trash2 } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';

export default function BedCard({ patient, device, session, reading, onAddPatient, onDelete }) {
  const { role } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const canDelete = ['admin', 'nurse'].includes(role);

  /* ── Empty bed ── */
  if (!patient) {
    return (
      <button
        onClick={onAddPatient || undefined}
        disabled={!onAddPatient}
        className={`w-full rounded-2xl border-2 border-dashed p-5 flex flex-col items-center justify-center h-64 transition-all ${
          onAddPatient
            ? 'border-slate-200 hover:border-primary-300 hover:bg-primary-50/40 cursor-pointer group'
            : 'border-slate-100 opacity-40 cursor-default'
        }`}
      >
        {onAddPatient ? (
          <>
            <div className="w-10 h-10 rounded-full bg-surface-low group-hover:bg-primary-100 flex items-center justify-center mb-2.5 transition">
              <Plus className="w-5 h-5 text-slate-400 group-hover:text-primary-500 transition" />
            </div>
            <p className="text-sm font-semibold text-slate-400 group-hover:text-primary-600 transition">Add Patient</p>
            <p className="text-xs text-slate-300 mt-0.5">Empty bed</p>
          </>
        ) : (
          <p className="text-xs text-slate-400 font-medium">Empty</p>
        )}
      </button>
    );
  }

  /* ── State ── */
  const isOffline = !device || device.status === 'offline';
  const percentage = isOffline ? null : (reading?.percentage ?? null);
  const grams = isOffline ? null : (reading?.weight_grams ?? null);
  const dripRate = reading?.drip_rate_ml_hr;

  let eta = '--';
  if (dripRate > 0 && grams > 0) {
    const hours = grams / dripRate;
    eta = `${Math.floor(hours)}h ${Math.floor((hours * 60) % 60)}m`;
  }

  let badgeCls, badgeText, accentColor, topBarColor;
  if (isOffline) {
    badgeCls = 'badge-offline'; badgeText = 'NO SENSOR';
    accentColor = 'border-slate-200'; topBarColor = 'bg-slate-300';
  } else if (patient.status === 'critical' || (percentage !== null && percentage <= 10)) {
    badgeCls = 'badge-critical'; badgeText = 'CRITICAL';
    accentColor = 'border-red-200'; topBarColor = 'bg-red-500';
  } else if (percentage !== null && percentage <= 20) {
    badgeCls = 'badge-warning'; badgeText = 'WARNING';
    accentColor = 'border-amber-200'; topBarColor = 'bg-amber-400';
  } else {
    badgeCls = 'badge-active'; badgeText = 'ACTIVE';
    accentColor = 'border-slate-100'; topBarColor = 'bg-emerald-500';
  }

  const rateDeviation = dripRate && patient.prescribed_drip_rate_ml_hr
    ? Math.abs(dripRate - patient.prescribed_drip_rate_ml_hr) / patient.prescribed_drip_rate_ml_hr : 0;
  const rateAnomaly = !isOffline && rateDeviation > 0.2;

  const handleDischarge = async (e) => {
    e.preventDefault(); e.stopPropagation();
    setDeleting(true);
    await supabase.from('patients').update({ status: 'discharged' }).eq('id', patient.id);
    await supabase.from('sessions').update({ status: 'completed', ended_at: new Date().toISOString() })
      .eq('patient_id', patient.id).eq('status', 'active');
    await supabase.from('alerts').update({ status: 'resolved' })
      .eq('patient_id', patient.id).eq('status', 'active');
    setDeleting(false);
    setConfirmDelete(false);
    onDelete?.();
  };

  return (
    <>
      <div className="relative group">
        {/* Delete button */}
        {canDelete && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDelete(true); }}
            className="absolute top-2 right-2 z-10 w-7 h-7 bg-white border border-slate-200 rounded-full shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:border-red-200"
            title="Discharge patient"
          >
            <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
          </button>
        )}

        <Link
          to={`/patient/${patient.id}`}
          className={`block bg-white rounded-2xl border-2 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden ${accentColor}`}
        >
          {/* Status top bar */}
          <div className={`h-1 w-full ${topBarColor}`} />

          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl font-light text-slate-300 leading-none">B{patient.bed_number}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isOffline
                  ? <WifiOff className="w-3 h-3 text-slate-400" />
                  : (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                  )
                }
                <span className={badgeCls}>{badgeText}</span>
              </div>
            </div>

            <div className="mb-3">
              <h3 className="font-semibold text-slate-900 leading-tight group-hover:text-primary-600 transition truncate text-[15px]">
                {patient.name}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{patient.patient_code}</p>
            </div>

            <div className="flex justify-center py-1">
              <IVGauge percentage={percentage} size={110} grams={grams} />
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ETA</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{eta}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rate ml/hr</p>
                <p className={`text-sm font-bold mt-0.5 ${rateAnomaly ? 'text-red-600' : 'text-slate-800'}`}>
                  {!isOffline && dripRate != null ? Math.round(dripRate) : '--'}
                  <span className="text-slate-400 font-normal text-xs"> /{patient.prescribed_drip_rate_ml_hr}</span>
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Discharge confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center">
            <div className="w-11 h-11 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">Discharge Patient?</h3>
            <p className="text-slate-500 text-sm mb-5">
              <strong>{patient.name}</strong> (Bed {patient.bed_number}) will be discharged and removed from the ward.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-surface-low transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDischarge}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition disabled:opacity-50"
              >
                {deleting ? '...' : 'Discharge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
