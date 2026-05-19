import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

export default function ReadingsChart({ patientId, warningThresholdGrams = 100 }) {
  const [data, setData] = useState([]);
  const [range, setRange] = useState('1h');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchReadings = async () => {
      setLoading(true);
      let hours = 1;
      if (range === '6h') hours = 6;
      else if (range === '24h') hours = 24;

      const timeLimit = new Date(Date.now() - hours * 3600000).toISOString();

      const { data: readingsData } = await supabase
        .from('readings')
        .select('*')
        .eq('patient_id', patientId)
        .gt('timestamp', timeLimit)
        .order('timestamp', { ascending: true });

      if (isMounted) {
        const formatted = (readingsData || []).map(r => {
          const date = new Date(r.timestamp);
          return {
            ...r,
            timeLabel: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
          };
        });
        setData(formatted);
        setLoading(false);
      }
    };

    fetchReadings();
    
    const channel = supabase.channel(`chart-${patientId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'readings', filter: `patient_id=eq.${patientId}` }, (payload) => {
        if (!isMounted) return;
        const r = payload.new;
        const date = new Date(r.timestamp);
        setData(prev => {
          const newPoint = {
            ...r,
            timeLabel: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
          };
          // For realtime, keep only relevant historical window
          const limit = range === '1h' ? 60 : (range === '6h' ? 360 : 1440);
          const next = [...prev, newPoint];
          return next.slice(-limit);
        });
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [patientId, range]);

  return (
    <div className="h-full w-full flex flex-col">
       <div className="h-full flex-1">
        {loading ? (
          <div className="h-full flex items-center justify-center">
             <div className="flex flex-col items-center gap-3">
               <div className="w-8 h-8 border-3 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hydrating Chart...</p>
             </div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-100 italic text-slate-400 text-xs">
            No readings recorded for this window.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -25 }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#F1F5F9" strokeDasharray="3 3" />
              <XAxis 
                dataKey="timeLabel" 
                tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} 
                axisLine={false} 
                tickLine={false} 
                minTickGap={30}
              />
              <YAxis 
                domain={['auto', 'auto']} 
                tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                content={<CustomTooltip />}
              />
              <ReferenceLine 
                y={warningThresholdGrams} 
                stroke="#EF4444" 
                strokeDasharray="4 4" 
                label={{ position: 'top', value: 'Critical Level', fill: '#EF4444', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }} 
              />
              <Area 
                type="monotone" 
                dataKey="weight_grams" 
                stroke="#7C3AED" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#chartGradient)"
                animationDuration={1500}
                activeDot={{ r: 6, stroke: '#FFF', strokeWidth: 2, fill: '#7C3AED' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 shadow-xl rounded-xl px-4 py-3 border border-slate-800 backdrop-blur-md bg-opacity-90">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary-500" />
          <p className="text-sm font-bold text-white">
            {payload[0].value.toFixed(1)} <span className="text-slate-400 font-normal">grams</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
}
