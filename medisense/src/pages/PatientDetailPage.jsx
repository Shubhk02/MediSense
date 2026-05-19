import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useWard } from '../context/WardContext';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Trash2, Pencil, Wifi, WifiOff, AlertTriangle,
  Droplets, Clock, TrendingUp, User, Activity, FileText, ChevronRight, RefreshCw
} from 'lucide-react';
import IVGauge from '../components/IVGauge';
import ReadingsChart from '../components/ReadingsChart';
import SessionModal from '../components/SessionModal';
import EditPatientModal from '../components/EditPatientModal';
import { supabase } from '../utils/supabase';

export default function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { patients, devices, sessions, readings, loading, refetch } = useWard();
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch?.();
    setTimeout(() => setRefreshing(false), 600);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <div className="w-14 h-14 border-4 border-surface-high rounded-full" />
            <div className="absolute inset-0 w-14 h-14 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-slate-700 font-semibold">Loading patient data...</p>
        </div>
      </div>
    );
  }

  const patient = patients.find(p => p.id === id);
  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-14 h-14 bg-surface-low rounded-2xl flex items-center justify-center mb-4 transition-all group hover:bg-red-50">
          <AlertTriangle className="w-7 h-7 text-slate-400 group-hover:text-red-500 transition-colors" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Patient Not Found</h2>
        <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">This patient may have been discharged or the code provided is incorrect.</p>
        <Link to="/" className="btn-primary text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Ward
        </Link>
      </div>
    );
  }

  const device = devices.find(d => d.patient_id === id);
  const session = sessions[id];
  const reading = readings[id];

  const isOffline = !device || device.status === 'offline';
  const percentage = isOffline ? null : (reading?.percentage ?? null);
  const grams = isOffline ? null : (reading?.weight_grams ?? null);
  const dripRate = reading?.drip_rate_ml_hr;

  let eta = '--';
  if (dripRate > 0 && grams > 0) {
    const hrs = grams / dripRate;
    eta = `${Math.floor(hrs)}h ${Math.floor((hrs * 60) % 60)}m`;
  }

  const isDripRateAnomaly = dripRate != null && patient.prescribed_drip_rate_ml_hr
    && Math.abs(dripRate - patient.prescribed_drip_rate_ml_hr) / patient.prescribed_drip_rate_ml_hr > 0.2;

  const canWrite = ['admin', 'nurse'].includes(role);

  const handleStopBag = async () => {
    // Logic removed as per request to undo latest session management changes
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await supabase.from('patients').update({ status: 'discharged' }).eq('id', id);
      await supabase.from('sessions').update({ status: 'completed', ended_at: new Date().toISOString() })
        .eq('patient_id', id).eq('status', 'active');
      await supabase.from('alerts').update({ status: 'resolved' })
        .eq('patient_id', id).eq('status', 'active');
      await refetch?.();
      navigate('/');
    } catch (err) {
      console.error('Delete error:', err);
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto page-enter">
      {/* ── Top bar / Breadcrumb ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/" className="text-slate-400 hover:text-primary-500 transition font-medium">Ward Overview</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-900 font-bold">Patient Details</span>
        </nav>
        
        {canWrite && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEdit(true)}
              className="btn-secondary text-sm h-10 px-4"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Profile
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50 px-4 h-10 rounded-xl transition text-sm font-semibold"
            >
              <Trash2 className="w-4 h-4" />
              Discharge
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT COLUMN ── */}
        <div className="space-y-4">
          {/* Main Info Card */}
          <div className="card overflow-hidden">
            <div className="bg-primary-50 px-5 py-4 flex items-center justify-between border-b border-primary-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 leading-none">{patient.name}</h1>
                  <p className="text-[11px] text-primary-600 font-bold uppercase tracking-widest mt-1">Bed {patient.bed_number}</p>
                </div>
              </div>
              <ActivityStatus status={patient.status} />
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Code" value={patient.patient_code} mono />
                <InfoItem label="Age / Gender" value={`${patient.age} / ${patient.gender}`} />
                <InfoItem label="Blood" value={patient.blood_group} highlight />
                <InfoItem label="Fluid" value={patient.iv_fluid_type || '—'} />
              </div>
              
              <div className="pt-4 border-t border-slate-50 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">Diagnosis</span>
                  <span className="text-slate-800 font-semibold text-right max-w-[150px] truncate">{patient.diagnosis}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">Doctor</span>
                  <span className="text-slate-800 font-semibold">{patient.doctor_assigned || 'Unassigned'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Prescription Context */}
          <div className="card p-5">
            <h3 className="section-label px-0 mb-4">IV Prescription</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-low border border-slate-100">
                <Droplets className="w-4 h-4 text-primary-500 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Prescribed Rate</p>
                  <p className="text-lg font-bold text-slate-900">{patient.prescribed_drip_rate_ml_hr} <span className="text-xs font-normal text-slate-400">ml/hr</span></p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-low border border-slate-100">
                <Wifi className={`w-4 h-4 mt-0.5 ${isOffline ? 'text-slate-300' : 'text-emerald-500'}`} />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Sensor Node</p>
                  <p className="text-sm font-bold text-slate-900 uppercase">{device?.device_id ?? 'None'}</p>
                  <p className={`text-[10px] font-bold ${isOffline ? 'text-slate-400' : 'text-emerald-600'}`}>
                    {isOffline ? 'OFFLINE' : 'ONLINE · TRANSMITTING'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency card */}
          {(patient.emergency_contact_name || patient.emergency_contact_phone) && (
            <div className="card p-5 bg-accent-50/30 border-accent-100/50">
              <h3 className="section-label px-0 mb-3 text-accent-700">Emergency Contact</h3>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-500/10 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-accent-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm leading-none">{patient.emergency_contact_name}</p>
                  <p className="text-slate-500 text-xs mt-1.5 font-medium">{patient.emergency_contact_phone}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Monitoring Dashboard Card */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold text-slate-800 tracking-tight">Real-time Monitoring</span>
              </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRefresh}
                    className="p-1.5 text-slate-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all"
                    title="Refresh Reading"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Live Flow</span>
                  </div>
                </div>
            </div>
            
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                {/* Gauge Section */}
                <div className="relative group">
                  <div className="absolute -inset-4 bg-primary-100/30 opacity-0 group-hover:opacity-100 blur-2xl rounded-full transition-opacity" />
                  <div className="relative">
                    <IVGauge percentage={percentage} grams={grams} size={200} />
                  </div>
                </div>

                {/* Vertical Metrics */}
                <div className="flex-1 w-full grid grid-cols-2 gap-4">
                  <DetailedStatRow
                    icon={<Clock className="w-4 h-4 text-primary-500" />}
                    label="ETA Empty"
                    value={eta}
                    sub="approximate"
                  />
                  <DetailedStatRow
                    icon={<TrendingUp className={`w-4 h-4 ${isDripRateAnomaly ? 'text-red-500' : 'text-accent-500'}`} />}
                    label="Actual Rate"
                    value={!isOffline && dripRate != null ? `${dripRate.toFixed(0)} ml/hr` : '--'}
                    sub={isDripRateAnomaly ? 'Caution: Rate mismatch' : 'Stabilized'}
                    isWarning={isDripRateAnomaly && !isOffline}
                  />
                  <DetailedStatRow
                    label="Remaining"
                    value={grams != null ? `${grams.toFixed(0)} g` : '--'}
                    sub="fluid weight"
                  />
                  
                  {/* Start Bag Action */}
                  <div className="flex items-end">
                    {canWrite && (
                      <button
                        onClick={() => setShowSessionModal(true)}
                        className="btn-primary w-full h-12 shadow-primary text-sm gap-2"
                      >
                        <Droplets className="w-4 h-4" />
                        Start New Bag
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart History */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary-500" />
                <h3 className="font-bold text-slate-900 tracking-tight">IV Fluid History</h3>
              </div>
              <div className="flex bg-surface-low p-1 rounded-lg">
                <button className="text-[10px] font-bold px-3 py-1 bg-white shadow-sm rounded-md text-slate-900 transition-all">Today</button>
                <button className="text-[10px] font-bold px-3 py-1 text-slate-400 hover:text-slate-600 transition-all">Week</button>
              </div>
            </div>
            <div className="h-[300px]">
              <ReadingsChart patientId={id} />
            </div>
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      {showSessionModal && (
        <SessionModal patientId={id} deviceId={device?.device_id} onClose={() => setShowSessionModal(false)} />
      )}

      {showDeleteConfirm && <DeleteConfirmModal patientName={patient.name} onCancel={() => setShowDeleteConfirm(false)} onConfirm={handleDelete} deleting={deleting} />}

      {showEdit && (
        <EditPatientModal
          patient={patient}
          device={device}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            refetch?.();
            setShowEdit(false);
          }}
        />
      )}
    </div>
  );
}

function InfoItem({ label, value, mono = false, highlight = false }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">{label}</p>
      <p className={`text-sm font-bold ${mono ? 'font-mono' : ''} ${highlight ? 'text-primary-600' : 'text-slate-800'}`}>
        {value}
      </p>
    </div>
  );
}

function DetailedStatRow({ icon, label, value, sub, isWarning = false }) {
  return (
    <div className={`p-4 rounded-2xl border transition-all ${isWarning ? 'bg-red-50 border-red-200' : 'bg-surface-low border-slate-100'}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-xl font-bold ${isWarning ? 'text-red-700' : 'text-slate-900'}`}>{value}</p>
      <p className={`text-[10px] font-semibold ${isWarning ? 'text-red-500' : 'text-slate-400'}`}>{sub}</p>
    </div>
  );
}

function ActivityStatus({ status }) {
  const styles = {
    active: 'bg-emerald-500 shadow-emerald-500/20',
    critical: 'bg-red-500 shadow-red-500/20 animate-pulse',
    discharged: 'bg-slate-400 shadow-slate-400/20',
  };
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full shadow-lg ${styles[status] ?? styles.active}`} />
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{status}</span>
    </div>
  );
}

function DeleteConfirmModal({ patientName, onCancel, onConfirm, deleting }) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-card-md w-full max-w-sm p-8 text-center page-enter">
        <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
          <Trash2 className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Discharge Patient?</h3>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          You are about to discharge <strong className="text-slate-900">{patientName}</strong>. 
          This will finalize all IV sessions and free up the bed.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
          >
            {deleting ? 'Processing...' : 'Yes, Discharge Patient'}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
