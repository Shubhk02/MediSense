import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { X, Droplets, ArrowRight, Activity } from 'lucide-react';

export default function SessionModal({ patientId, deviceId, onClose }) {
  const { profile } = useAuth();
  const [weight, setWeight] = useState(500);
  const [bagType, setBagType] = useState('Normal Saline 500ml');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    // End active session first
    await supabase.from('sessions')
      .update({ status: 'completed', ended_at: new Date().toISOString() })
      .eq('patient_id', patientId)
      .eq('status', 'active');

    // Create new session
    await supabase.from('sessions').insert({
      patient_id: patientId,
      device_id: deviceId,
      initial_weight_grams: weight,
      bag_type: bagType,
      started_by: profile.id
    });

    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[32px] shadow-card-lg w-full max-w-md p-8 relative page-enter">
        <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-primary-500/10">
          <Droplets className="w-7 h-7 text-primary-500" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Start New Bag</h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Attaching a new IV bag will end the current monitoring session and reset telemetry baselines.
        </p>

        <div className="bg-accent-50/50 border border-accent-100 rounded-2xl p-4 flex items-start gap-3 mb-8">
          <Activity className="w-4 h-4 text-accent-600 mt-0.5" />
          <p className="text-[11px] font-bold text-accent-700 leading-normal uppercase tracking-wider">
            Current session will be marked "Completed" in telemetry logs.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Fluid / Bag Type</label>
            <input 
              type="text" 
              required
              value={bagType}
              onChange={(e) => setBagType(e.target.value)}
              className="input w-full" 
              placeholder="e.g. Normal Saline 500ml"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Initial Fill Weight (g)</label>
            <div className="relative">
               <input 
                type="number" 
                required
                min="50"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="input w-full pr-12 font-bold" 
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">grams</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary h-12 shadow-primary rounded-2xl mt-4"
          >
            {loading ? 'Initializing...' : <>Initialize Bag <ArrowRight className="w-4 h-4 ml-2" /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
