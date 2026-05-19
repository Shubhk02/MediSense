import React, { useState } from 'react';
import { useWard } from '../context/WardContext';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Smartphone, Shield, Search, Plus, 
  MoreVertical, Edit2, Trash2, Filter, Download, FileText
} from 'lucide-react';
import AddPatientModal from '../components/AddPatientModal';

export default function AdminPage() {
  const { patients, devices, loading } = useWard();
  const { profile } = useAuth();
  const [tab, setTab] = useState('patients');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleExport = (data, fileName) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <div className="w-14 h-14 border-4 border-surface-high rounded-full" />
            <div className="absolute inset-0 w-14 h-14 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-slate-700 font-semibold">Loading administration data...</p>
        </div>
      </div>
    );
  }

  const activePatients = patients.filter(p => p.status === 'active');
  const offlineDevices = devices.filter(d => d.status === 'offline');

  return (
    <div className="max-w-7xl mx-auto page-enter">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Administration</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage clinical assets, hardware, and system access.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleExport(tab === 'patients' ? patients : devices, tab)}
            className="btn-secondary text-sm"
          >
            <Download className="w-4 h-4" />
            Export {tab === 'patients' ? 'Patients' : 'Devices'}
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-sm"
          >
            <Plus className="w-4 h-4" />
            Add New Record
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <AdminStatCard 
          icon={<Users className="w-5 h-5 text-primary-500" />} 
          label="Total Patients" 
          value={patients.length} 
          sub={`${activePatients.length} Active in ward`}
        />
        <AdminStatCard 
          icon={<Smartphone className="w-5 h-5 text-accent-500" />} 
          label="Managed Devices" 
          value={devices.length} 
          sub={`${offlineDevices.length} Currently offline`}
        />
        <AdminStatCard 
          icon={<Shield className="w-5 h-5 text-emerald-500" />} 
          label="System Access" 
          value={3} 
          sub="Authorized personnel"
        />
      </div>

      {/* Main Control Panel */}
      <div className="card overflow-hidden">
        {/* Tab Switcher */}
        <div className="bg-surface-low border-b border-slate-100 px-4 flex items-center justify-between">
          <div className="flex">
            {['patients', 'devices', 'personnel'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-4 text-sm font-bold capitalize border-b-2 transition-all ${
                  tab === t 
                    ? 'border-primary-500 text-primary-600' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          
          <div className="hidden md:flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                type="text" 
                placeholder="Search records..." 
                className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 outline-none w-48 transition-all"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-0 overflow-x-auto">
          {tab === 'patients' && (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bed</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medical Info</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {patients.map(p => (
                  <tr key={p.id} className="hover:bg-surface-low/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{p.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">{p.patient_code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-600">Bed {p.bed_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-semibold text-slate-700">{p.diagnosis}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{p.blood_group} · {p.age} yrs</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <span className="text-[11px] font-bold text-slate-500 uppercase">{p.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {(tab === 'devices' || tab === 'personnel') && (
            <div className="py-20 text-center">
              <div className="w-12 h-12 bg-surface-low rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-slate-500 font-semibold">Table view expanding soon</p>
              <p className="text-xs text-slate-400 mt-1">Management for {tab} is currently performed via terminal API.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Access Info */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 border-l-4 border-l-primary-500">
          <h3 className="font-bold text-slate-900 mb-2">Hospital API Configuration</h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Integration keys for sensor nodes (ESP8266/ESP32) and external health record synchronization.
          </p>
          <button className="text-primary-600 text-xs font-bold flex items-center gap-1.5 hover:underline decoration-2">
            View API Settings <Plus className="w-3 h-3" />
          </button>
        </div>
        <div className="card p-6 border-l-4 border-l-accent-500">
          <h3 className="font-bold text-slate-900 mb-2">System Audit Logs</h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Recent administrative actions, discharge history, and critical alert resolutions for compliance.
          </p>
          <button 
            onClick={() => handleExport(patients, 'Full_Audit_Log')}
            className="text-accent-600 text-xs font-bold flex items-center gap-1.5 hover:underline decoration-2"
          >
            Generate Report <Download className="w-3 h-3" />
          </button>
        </div>
      </div>

      {showAddModal && (
        <AddPatientModal
          onClose={() => setShowAddModal(false)}
          occupiedBeds={patients.map(p => p.bed_number)}
          onSuccess={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

function AdminStatCard({ icon, label, value, sub }) {
  return (
    <div className="card p-5 group hover:border-primary-200 transition-all cursor-default">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-surface-low flex items-center justify-center group-hover:bg-white group-hover:shadow-soft transition-all">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
          <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1.5">{sub}</p>
        </div>
      </div>
    </div>
  );
}
