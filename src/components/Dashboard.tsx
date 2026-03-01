import React from 'react';
import { Thermometer, Gauge, Box } from 'lucide-react';

interface GaugeDisplayProps {
  label: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
}

const GaugeDisplay: React.FC<GaugeDisplayProps> = ({ label, value, unit, icon, color }) => (
  <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 flex items-center gap-4 w-full transition-all hover:scale-105">
    <div className={`p-3 rounded-xl ${color} text-white shadow-lg`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className="text-xl font-black text-slate-800 font-mono">
        {value.toFixed(1)}<span className="text-xs font-bold text-slate-400 ml-1">{unit}</span>
      </p>
    </div>
  </div>
);

interface DashboardProps {
  pressure: number;
  volume: number;
  temperature: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ pressure, volume, temperature }) => {
  return (
    <div className="flex flex-col gap-3 w-48">
      <GaugeDisplay 
        label="Áp suất (P)" 
        value={pressure} 
        unit="kPa" 
        icon={<Gauge size={16} />} 
        color="bg-teal-600" 
      />
      <GaugeDisplay 
        label="Thể tích (V)" 
        value={volume} 
        unit="L" 
        icon={<Box size={16} />} 
        color="bg-indigo-600" 
      />
      <GaugeDisplay 
        label="Nhiệt độ (T)" 
        value={temperature} 
        unit="K" 
        icon={<Thermometer size={16} />} 
        color="bg-rose-600" 
      />
    </div>
  );
};
