import React, { useState } from 'react';
import { useWard } from '../context/WardContext';
import { useAuth } from '../context/AuthContext';
import BedCard from '../components/BedCard';
import AddPatientModal from '../components/AddPatientModal';
import { useAlerts } from '../context/AlertContext';
import { Plus, RefreshCw, Users, BedDouble, AlertTriangle, Wifi } from 'lucide-react';

export default function WardOverviewPage() {
  const { patients, devices, sessions, readings, loading, refetch } = useWard();
  const { role } = useAuth();
  const { alerts } = useAlerts();
  const [showAddPatient, setShowAddPatient] = useState(false);
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
          <p className="text-slate-700 font-semibold">Loading ward data...</p>
          <p className="text-slate-400 text-sm mt-1">Connecting to sensors</p>
        </div>
      </div>
    );
  }

  const beds = Array.from({ length: 10 }, (_, i) => i + 1);
  const occupiedBeds = patients.map(p => p.bed_number);
  const canAddPatient = ['admin', 'nurse'].includes(role);
  const activeAlerts = alerts.filter(a => a.status === 'active').length;
  const onlineDevices = devices.filter(d => d.status === 'online').length;

  return (
    <div className="page-enter max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ward Overview</h1>
          <p className="text-slate-500 text-sm mt-0.5">Real-time IV drip monitoring · {patients.length} active patient{patients.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="btn-ghost text-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          {canAddPatient && (
            <button onClick={() => setShowAddPatient(true)} className="btn-primary text-sm">
              <Plus className="w-4 h-4" />
              Add Patient
            </button>
          )}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<Users className="w-4 h-4 text-primary-500" />}
          iconBg="bg-primary-50"
          value={patients.length}
          label="Active Patients"
          sub={`of 10 beds`}
        />
        <StatCard
          icon={<BedDouble className="w-4 h-4 text-slate-500" />}
          iconBg="bg-slate-100"
          value={10 - patients.length}
          label="Open Beds"
          sub="available"
        />
        <StatCard
          icon={<AlertTriangle className={`w-4 h-4 ${activeAlerts > 0 ? 'text-red-500' : 'text-amber-400'}`} />}
          iconBg={activeAlerts > 0 ? 'bg-red-50' : 'bg-amber-50'}
          value={activeAlerts}
          label="Active Alerts"
          sub={activeAlerts > 0 ? 'need attention' : 'all clear'}
          highlight={activeAlerts > 0}
        />
        <StatCard
          icon={<Wifi className="w-4 h-4 text-emerald-500" />}
          iconBg="bg-emerald-50"
          value={onlineDevices}
          label="Online Devices"
          sub={`of ${devices.length} total`}
        />
      </div>

      {/* ── Bed grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {beds.map(bedNumber => {
          const patient = patients.find(p => p.bed_number === bedNumber);
          const device = patient ? devices.find(d => d.patient_id === patient.id) : null;
          const session = patient ? sessions[patient.id] : null;
          const reading = patient ? readings[patient.id] : null;
          return (
            <BedCard
              key={bedNumber}
              patient={patient}
              device={device}
              session={session}
              reading={reading}
              onAddPatient={!patient && canAddPatient ? () => setShowAddPatient(true) : null}
              onDelete={handleRefresh}
            />
          );
        })}
      </div>

      {showAddPatient && (
        <AddPatientModal
          occupiedBeds={occupiedBeds}
          onClose={() => setShowAddPatient(false)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}

function StatCard({ icon, iconBg, value, label, sub, highlight }) {
  return (
    <div className={`card px-4 py-3.5 flex items-center gap-3 transition-all ${highlight ? 'border-red-200 bg-red-50/40' : ''}`}>
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`text-2xl font-bold leading-none ${highlight ? 'text-red-600' : 'text-slate-900'}`}>{value}</p>
        <p className="text-xs font-semibold text-slate-600 mt-0.5 truncate">{label}</p>
        <p className="text-[10px] text-slate-400 truncate">{sub}</p>
      </div>
    </div>
  );
}
