import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Asterisk, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regRole, setRegRole] = useState('nurse');

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) setError(error.message);
    else navigate('/');
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    if (regPassword !== regConfirm) return setError('Passwords do not match.');
    if (regPassword.length < 8) return setError('Password must be at least 8 characters.');
    setLoading(true);

    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: regEmail, password: regPassword, name: regName, role: regRole }),
    });
    const result = await res.json();
    setLoading(false);

    if (!res.ok || result.error) {
      return setError(result.error || 'Registration failed. Please try again.');
    }
    setSuccess('Account created! You can now sign in.');
    setTimeout(() => {
      setTab('login');
      setEmail(regEmail);
      setSuccess(null);
    }, 2500);
  };

  const switchTab = (t) => { setTab(t); setError(null); setSuccess(null); };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* ── Left hero panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Asterisk className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-bold text-lg">MediSense</span>
        </div>

        {/* Hero content */}
        <div className="relative z-10">
          {/* Fake IV monitor card */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-8 max-w-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/70 text-xs font-medium">Live Monitoring</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Patients', value: '7', trend: '+2' },
                { label: 'Alerts', value: '2', trend: '!', alert: true },
                { label: 'Avg Level', value: '68%', trend: '↑' },
              ].map(m => (
                <div key={m.label}>
                  <p className="text-white/50 text-[10px] font-medium uppercase tracking-wide">{m.label}</p>
                  <p className="text-white text-2xl font-bold">{m.value}</p>
                  <p className={`text-[11px] font-semibold ${m.alert ? 'text-red-300' : 'text-emerald-300'}`}>{m.trend}</p>
                </div>
              ))}
            </div>
            {/* Fake sparkline */}
            <div className="mt-4 flex items-end gap-1 h-10">
              {[40, 65, 45, 80, 60, 75, 55, 70, 50, 85, 62, 78].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-white/25"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-3">
            Real-time IV drip<br />monitoring system
          </h1>
          <p className="text-white/60 text-base">
            Precision monitoring for every patient, every drop, every moment.
          </p>
        </div>

        <p className="relative z-10 text-white/30 text-xs">
          MediSense Hospital Network · Authorized Personnel Only
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center">
            <Asterisk className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-slate-900 font-bold text-lg">MediSense</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back 👋</h2>
            <p className="text-slate-500 text-sm mt-1">Sign in to your MediSense account</p>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1.5 mb-6 p-1 bg-surface-low rounded-xl">
            {['login', 'register'].map(t => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === t
                    ? 'bg-white text-slate-900 shadow-card'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 p-3.5 rounded-xl mb-5 text-sm">
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-xl mb-5 text-sm">
              <span>✓</span>
              <span>{success}</span>
            </div>
          )}

          {/* ── LOGIN ── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <Field label="Email address" type="email" value={email} onChange={setEmail} placeholder="admin@medisense.local" required />
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm mt-1"
              >
                {loading ? <Spinner /> : 'Sign In →'}
              </button>

              {/* Demo logins */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-center text-xs text-slate-400 mb-2">Quick demo login</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Admin', email: 'admin@medisense.local', pw: 'Admin@1234' },
                    { label: 'Nurse', email: 'nurse@medisense.local', pw: 'Nurse@1234' },
                    { label: 'Doctor', email: 'doctor@medisense.local', pw: 'Doctor@1234' },
                  ].map(demo => (
                    <button
                      key={demo.label}
                      type="button"
                      onClick={() => { setEmail(demo.email); setPassword(demo.pw); }}
                      className="py-2 rounded-lg text-xs font-semibold bg-surface-low hover:bg-surface-high text-slate-600 hover:text-slate-800 transition border border-slate-100"
                    >
                      {demo.label}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* ── REGISTER ── */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <Field label="Full name" value={regName} onChange={setRegName} placeholder="Dr. Priya Sharma" required />

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-widest">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'nurse', label: '🩺 Nurse', desc: 'Patient care' },
                    { value: 'doctor', label: '👨‍⚕️ Doctor', desc: 'Prescriptions' },
                  ].map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRegRole(r.value)}
                      className={`p-3 rounded-xl border-2 text-left transition ${
                        regRole === r.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-800">{r.label}</p>
                      <p className="text-xs text-slate-400">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Email" type="email" value={regEmail} onChange={setRegEmail} placeholder="you@hospital.com" required />
              <Field label="Password" type="password" value={regPassword} onChange={setRegPassword} placeholder="Min. 8 characters" required />
              <Field label="Confirm password" type="password" value={regConfirm} onChange={setRegConfirm} placeholder="••••••••" required />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 mt-1"
              >
                {loading ? <Spinner /> : 'Create Account →'}
              </button>
              <p className="text-center text-xs text-slate-400">
                Admin accounts are created by existing administrators only.
              </p>
            </form>
          )}

          {/* Security note */}
          <div className="flex items-center justify-center gap-1.5 mt-6 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-xs">Protected by enterprise-grade encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-widest">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input"
      />
    </div>
  );
}

function Spinner() {
  return (
    <span className="flex items-center justify-center">
      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </span>
  );
}
