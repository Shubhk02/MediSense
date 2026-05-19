import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { X, Plus, User, Droplets, Smartphone, Check, ChevronRight } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const FLUID_TYPES = ['Normal Saline 0.9%', 'Ringer Lactate', 'Dextrose 5%', 'Dextrose Saline', 'Half Normal Saline'];

export default function AddPatientModal({ onClose, onSuccess, occupiedBeds = [] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); 

  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'Male',
    blood_group: 'O+',
    diagnosis: '',
    bed_number: '',
    iv_fluid_type: 'Normal Saline 0.9%',
    prescribed_drip_rate_ml_hr: 60,
    doctor_assigned: '',
    nurse_assigned: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  const [deviceId, setDeviceId] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [createdPatientId, setCreatedPatientId] = useState(null);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const availableBeds = Array.from({ length: 10 }, (_, i) => i + 1).filter(b => !occupiedBeds.includes(b));

  const handleStep1 = async (e) => {
    e.preventDefault();
    if (!form.bed_number) return setError('Please select a bed number.');
    setError(null);
    setLoading(true);

    const { data, error: insertError } = await supabase.from('patients').insert({
      ...form,
      bed_number: parseInt(form.bed_number),
      age: parseInt(form.age),
      prescribed_drip_rate_ml_hr: parseInt(form.prescribed_drip_rate_ml_hr),
      status: 'active',
    }).select().single();

    setLoading(false);
    if (insertError) return setError(insertError.message);
    setCreatedPatientId(data.id);
    setStep(2);
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    if (!deviceId.trim()) {
      onSuccess?.();
      onClose();
      return;
    }
    setLoading(true);
    setError(null);

    let devError;
    const devicePayload = {
      device_id: deviceId.trim(),
      mac_address: macAddress.trim() || null,
      bed_number: parseInt(form.bed_number),
      patient_id: createdPatientId,
      status: 'offline',
      calibration_offset: 0,
    };

    // Try to insert first
    const { error: insertError } = await supabase
      .from('devices')
      .insert(devicePayload);

    if (insertError) {
      // If duplicate key, try to update
      if (insertError.code === '23505' || insertError.message?.includes('unique constraint')) {
        const { error: updateError } = await supabase
          .from('devices')
          .update(devicePayload)
          .eq('device_id', deviceId.trim());
        devError = updateError;
      } else {
        devError = insertError;
      }
    }

    setLoading(false);
    if (devError) return setError(devError.message);
    onSuccess?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[32px] shadow-card-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col page-enter">
        {/* Header */}
        <div className="bg-primary-50 px-8 py-6 flex items-center justify-between border-b border-primary-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Add New Patient</h2>
            <div className="flex items-center mt-3 gap-2">
              <StepIndicator num={1} active={step >= 1} done={step > 1} label="Patient Info" />
              <div className={`h-px w-6 transition-colors ${step > 1 ? 'bg-primary-500' : 'bg-primary-200'}`} />
              <StepIndicator num={2} active={step >= 2} done={step > 2} label="Link Device" />
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white/50 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                <X className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs font-bold text-red-700">{error}</p>
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputGroup label="Full Name *" className="sm:col-span-2">
                  <input required className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. John Doe" />
                </InputGroup>
                
                <InputGroup label="Age *">
                  <input required type="number" min="0" max="120" className="input" value={form.age} onChange={e => set('age', e.target.value)} />
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

                <InputGroup label="Bed Number *">
                  <select required className="input font-bold text-primary-600" value={form.bed_number} onChange={e => set('bed_number', e.target.value)}>
                    <option value="">Select bed...</option>
                    {availableBeds.map(b => <option key={b} value={b}>Bed {b}</option>)}
                  </select>
                </InputGroup>

                <InputGroup label="Diagnosis *" className="sm:col-span-2">
                  <input required className="input" value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} placeholder="Main condition" />
                </InputGroup>

                <InputGroup label="IV Fluid Type">
                  <select className="input" value={form.iv_fluid_type} onChange={e => set('iv_fluid_type', e.target.value)}>
                    {FLUID_TYPES.map(f => <option key={f}>{f}</option>)}
                  </select>
                </InputGroup>

                <InputGroup label="Prescribed Rate (ml/hr)">
                  <input type="number" min="1" className="input" value={form.prescribed_drip_rate_ml_hr} onChange={e => set('prescribed_drip_rate_ml_hr', e.target.value)} />
                </InputGroup>

                <InputGroup label="Doctor">
                  <input className="input" value={form.doctor_assigned} onChange={e => set('doctor_assigned', e.target.value)} placeholder="Assigned physician" />
                </InputGroup>

                <InputGroup label="Nurse">
                  <input className="input" value={form.nurse_assigned} onChange={e => set('nurse_assigned', e.target.value)} placeholder="Attending nurse" />
                </InputGroup>

                <InputGroup label="Emergency Contact">
                  <input className="input" value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} placeholder="Name" />
                </InputGroup>

                <InputGroup label="Emergency Phone">
                  <input className="input" value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} placeholder="+91 ..." />
                </InputGroup>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={loading} className="btn-primary px-8 h-12 shadow-primary">
                  {loading ? 'Creating...' : <>Next: Link Device <ChevronRight className="w-4 h-4 ml-1" /></>}
                </button>
              </div>
            </form>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <form onSubmit={handleStep2} className="p-8 space-y-6">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-800">Patient created successfully!</p>
                  <p className="text-xs text-emerald-600 mt-0.5 font-medium leading-relaxed">
                    Now connect an IV sensor node to this bed. You can skip this and link it later.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-[24px] p-6 font-mono text-xs overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-4">
                  <Smartphone className="w-10 h-10 text-white/5" />
                </div>
                <p className="text-primary-400 mb-3 font-sans text-[10px] font-black uppercase tracking-widest">ESP8266 Configuration Guide</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-slate-500 mb-1">API Endpoint</p>
                    <p className="text-white break-all leading-relaxed">https://zhnbuhvlyrbmvuenmipf.supabase.co/functions/v1/ingest-reading</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">JSON Payload</p>
                    <p className="text-emerald-400 leading-relaxed">{`{ "device_id": "${deviceId || 'DEVICE_ID'}", "weight_grams": 450 }`}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputGroup label="Device ID (Firmware ID) *">
                  <input className="input" value={deviceId} onChange={e => setDeviceId(e.target.value)}
                    placeholder={`e.g. MS_BED_0${form.bed_number}`} />
                </InputGroup>
                
                <InputGroup label="MAC Address (optional)">
                  <input className="input" value={macAddress} onChange={e => setMacAddress(e.target.value)} placeholder="AA:BB:CC:DD:EE:FF" />
                </InputGroup>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <button type="button" onClick={() => { onSuccess?.(); onClose(); }} className="text-slate-400 hover:text-slate-600 font-bold text-sm px-4">
                  Skip for now
                </button>
                <button type="submit" disabled={loading} className="btn-primary px-8 h-12 shadow-primary">
                  {loading ? 'Linking...' : 'Complete Setup (v3)'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ num, active, done, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
        done 
          ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
          : active 
            ? 'bg-white text-primary-600 shadow-soft' 
            : 'bg-primary-100 text-primary-300'
      }`}>
        {done ? <Check className="w-3 h-3 stroke-[3]" /> : num}
      </div>
      <span className={`text-[11px] font-bold tracking-tight transition-colors ${active ? 'text-primary-700' : 'text-primary-300'}`}>
        {label}
      </span>
    </div>
  );
}

function InputGroup({ label, children, className = "" }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">{label}</label>
      {children}
    </div>
  );
}
