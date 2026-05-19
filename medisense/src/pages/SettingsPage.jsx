import React, { useState, useEffect } from 'react';
import { Settings, Bell, Key, Save, ShieldCheck, Check } from 'lucide-react';

export default function SettingsPage() {
  const [thresholds, setThresholds] = useState({ warning: 20, critical: 10 });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('medisense_settings');
    if (stored) setThresholds(JSON.parse(stored));
  }, []);

  const handleSave = () => {
    localStorage.setItem('medisense_settings', JSON.stringify(thresholds));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Configuration for monitoring thresholds and system access.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation / Sidebar for Settings */}
        <div className="space-y-1">
          <SettingsNavLink icon={<Bell className="w-4 h-4" />} label="Alert Thresholds" active />
          <SettingsNavLink icon={<ShieldCheck className="w-4 h-4" />} label="Account & Access" />
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 space-y-6">
          <div className="card">
            <div className="px-6 py-4 border-b border-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">Alert Thresholds</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Define when system triggers visual and audible alerts.</p>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Warning Level (%)</label>
                  <input 
                    type="number" 
                    value={thresholds.warning}
                    onChange={e => setThresholds({ ...thresholds, warning: parseInt(e.target.value) })}
                    className="input w-full font-bold"
                  />
                  <p className="text-[10px] text-slate-400">Triggers orange markers on beds.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Critical Level (%)</label>
                  <input 
                    type="number" 
                    value={thresholds.critical}
                    onChange={e => setThresholds({ ...thresholds, critical: parseInt(e.target.value) })}
                    className="input w-full font-bold"
                  />
                  <p className="text-[10px] text-slate-400">Triggers red pulsing alerts.</p>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between opacity-50">
                <div>
                  <p className="text-sm font-bold text-slate-700">Audible Alarms</p>
                  <p className="text-xs text-slate-400">Managed by system administrator.</p>
                </div>
                <div className="w-10 h-6 bg-slate-200 rounded-full flex items-center px-1">
                  <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={handleSave}
                className="btn-primary gap-2 h-10 px-6 shadow-primary transition-all active:scale-95"
              >
                {saved ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
                {saved ? 'Settings Saved' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="card p-6 border-dashed border-2 bg-transparent border-slate-100 flex flex-col items-center justify-center text-center py-12">
            <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <Key className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-400">Integration settings moved to Admin</p>
            <p className="text-xs text-slate-400 max-w-xs mt-1">To change API tokens or hospital naming, please visit the Administration tab.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsNavLink({ icon, label, active = false }) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
      active 
        ? 'bg-primary-50 text-primary-600 shadow-sm' 
        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
    }`}>
      <span className={active ? 'text-primary-500' : 'text-slate-300'}>{icon}</span>
      {label}
    </button>
  );
}
