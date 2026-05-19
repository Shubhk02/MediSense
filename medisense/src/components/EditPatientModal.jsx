import React, { useState } from 'react';
import { X, Save, Loader2, User, FileText, Heart, Activity, Smartphone } from 'lucide-react';
import { supabase } from '../utils/supabase';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const FLUID_TYPES = ['Normal Saline 0.9%', 'Ringer Lactate', 'Dextrose 5%', 'Dextrose Saline', 'Half Normal Saline'];
const STATUSES = ['active', 'critical', 'stable'];

export default function EditPatientModal({ patient, device, onClose, onSaved }) {
  const [form, setForm] = useState({ 
    ...patient,
    device_id: device?.device_id || '',
    mac_address: device?.mac_address || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Filter out the current patient's bed from the "occupied" list if necessary
  // but simpler to just show all and validate.

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // 1. Update Patient Data
    const { error: err } = await supabase.from('patients').update({
      name: form.name,
      age: parseInt(form.age),
      gender: form.gender,
      blood_group: form.blood_group,
      diagnosis: form.diagnosis,
      iv_fluid_type: form.iv_fluid_type,
      bed_number: parseInt(form.bed_number),
      prescribed_drip_rate_ml_hr: parseInt(form.prescribed_drip_rate_ml_hr),
      doctor_assigned: form.doctor_assigned,
      nurse_assigned: form.nurse_assigned,
      emergency_contact_name: form.emergency_contact_name,
      emergency_contact_phone: form.emergency_contact_phone,
      status: form.status,
    }).eq('id', patient.id);

    if (err) {
      setSaving(false);
      return setError(err.message);
    }

    // 2. Handle Device Reassignment if changed
    const newDeviceId = form.device_id?.trim();
    const oldDeviceId = device?.device_id;

    if (newDeviceId !== oldDeviceId) {
      // Unlink old device if it existed
      if (oldDeviceId) {
        await supabase.from('devices').update({ patient_id: null }).eq('device_id', oldDeviceId);
      }

      // Link new device if provided
      if (newDeviceId) {
        const devicePayload = {
          device_id: newDeviceId,
          mac_address: form.mac_address?.trim() || null,
          bed_number: parseInt(form.bed_number),
          patient_id: patient.id,
          status: 'offline',
          calibration_offset: 0,
        };

        // Try insert then update (Insert-then-Update pattern)
        const { error: insErr } = await supabase.from('devices').insert(devicePayload);
        if (insErr && (insErr.code === '23505' || insErr.message?.includes('unique'))) {
          await supabase.from('devices').update(devicePayload).eq('device_id', newDeviceId);
        }
      }
    } else if (newDeviceId && (form.mac_address !== device?.mac_address || form.bed_number !== patient.bed_number)) {
      // Just update metadata if ID is the same
      await supabase.from('devices').update({
        mac_address: form.mac_address?.trim() || null,
        bed_number: parseInt(form.bed_number)
      }).eq('device_id', newDeviceId);
    }

    setSaving(false);
    if (err) return setError(err.message);
    onSaved?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[32px] shadow-card-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col page-enter">
        {/* Header */}
        <div className="bg-primary-50 px-8 py-6 flex items-center justify-between border-b border-primary-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-soft text-primary-500">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Edit Profile</h2>
              <p className="text-[10px] text-primary-600 font-bold uppercase tracking-widest mt-1">
                {patient.patient_code} · Bed {patient.bed_number}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white/50 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 p-8 space-y-8 custom-scrollbar">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 text-white font-bold">!</div>
                <p className="text-xs font-bold text-red-700">{error}</p>
              </div>
            )}

            {/* Basic Info */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-3.5 h-3.5 text-primary-500" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">General Information</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputGroup label="Full Name" className="sm:col-span-1">
                  <input required className="input" value={form.name} onChange={e => set('name', e.target.value)} />
                </InputGroup>
                <div className="grid grid-cols-2 gap-4 sm:col-span-1">
                  <InputGroup label="Bed Number">
                    <select required className="input font-bold" value={form.bed_number} onChange={e => set('bed_number', e.target.value)}>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(b => (
                        <option key={b} value={b}>Bed {b}</option>
                      ))}
                    </select>
                  </InputGroup>
                  <InputGroup label="Status">
                    <select className={`input font-bold ${form.status === 'critical' ? 'text-red-500' : 'text-emerald-600'}`} value={form.status} onChange={e => set('status', e.target.value)}>
                      {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                  </InputGroup>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-5">
                <InputGroup label="Age">
                  <input type="number" min="0" max="120" required className="input" value={form.age} onChange={e => set('age', e.target.value)} />
                </InputGroup>
                <InputGroup label="Gender">
                  <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </InputGroup>
                <InputGroup label="Blood Group">
                  <select className="input" value={form.blood_group} onChange={e => set('blood_group', e.target.value)}>
                    {BLOOD_GROUPS.map(bg => <option key={bg}>{bg}</option>)}
                  </select>
                </InputGroup>
              </div>
              <InputGroup label="Diagnosis">
                <input required className="input" value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} />
              </InputGroup>
            </section>

            {/* Medical Config */}
            <section className="space-y-4 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-3.5 h-3.5 text-primary-500" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">IV Configuration</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputGroup label="Fluid Type">
                  <select className="input" value={form.iv_fluid_type} onChange={e => set('iv_fluid_type', e.target.value)}>
                    {FLUID_TYPES.map(f => <option key={f}>{f}</option>)}
                  </select>
                </InputGroup>
                <InputGroup label="Prescribed Rate (ml/hr)">
                  <input type="number" min="1" required className="input font-bold" value={form.prescribed_drip_rate_ml_hr} onChange={e => set('prescribed_drip_rate_ml_hr', e.target.value)} />
                </InputGroup>
              </div>
            </section>

            {/* Hardware Config */}
            <section className="space-y-4 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-3.5 h-3.5 text-primary-500" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hardware / Sensor</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputGroup label="Device ID (Hardware ID)">
                  <input className="input font-mono" placeholder="e.g. NODE-01" value={form.device_id} onChange={e => set('device_id', e.target.value)} />
                </InputGroup>
                <InputGroup label="MAC Address (Optional)">
                  <input className="input font-mono" placeholder="e.g. AA:BB:CC:..." value={form.mac_address} onChange={e => set('mac_address', e.target.value)} />
                </InputGroup>
              </div>
            </section>

            {/* Personnel & Emergency */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-slate-50">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medical Personnel</p>
                <InputGroup label="Doctor Assigned">
                  <input className="input" value={form.doctor_assigned ?? ''} onChange={e => set('doctor_assigned', e.target.value)} />
                </InputGroup>
                <InputGroup label="Nurse Assigned">
                  <input className="input" value={form.nurse_assigned ?? ''} onChange={e => set('nurse_assigned', e.target.value)} />
                </InputGroup>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emergency Contact</p>
                <InputGroup label="Full Name">
                  <input className="input" value={form.emergency_contact_name ?? ''} onChange={e => set('emergency_contact_name', e.target.value)} />
                </InputGroup>
                <InputGroup label="Contact Number">
                  <input className="input" value={form.emergency_contact_phone ?? ''} onChange={e => set('emergency_contact_phone', e.target.value)} />
                </InputGroup>
              </div>
            </section>
          </div>

          {/* Footer Actions */}
          <div className="px-8 py-5 border-t border-slate-50 flex justify-end gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} className="px-6 h-11 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
              Discard Changes
            </button>
            <button type="submit" disabled={saving} className="btn-primary px-8 h-11 shadow-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Syncing...' : 'Update Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InputGroup({ label, children, className = "" }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{label}</label>
      {children}
    </div>
  );
}
