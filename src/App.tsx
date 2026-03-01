import React, { useState, useEffect } from 'react';
import { Simulation2D } from './components/Simulation2D';
import { Dashboard } from './components/Dashboard';
import { GasChart } from './components/GasChart';
import { GasProcess, GasState, Measurement } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Info, RefreshCcw, Table as TableIcon, Activity } from 'lucide-react';

const INITIAL_STATE: GasState = {
  pressure: 100,
  volume: 50,
  temperature: 300,
};

export default function App() {
  const [process, setProcess] = useState<GasProcess>('isothermal');
  const [state, setState] = useState<GasState>(INITIAL_STATE);
  const [history, setHistory] = useState<Measurement[]>([]);
  const [view, setView] = useState<'table' | 'chart'>('table');

  // Ideal Gas Law: PV = nRT. We'll fix nR based on initial state
  const [nR] = useState((100 * 50) / 300);

  const resetSimulation = () => {
    setState(INITIAL_STATE);
    setHistory([]);
  };

  const handleProcessChange = (newProcess: GasProcess) => {
    setProcess(newProcess);
    // We don't necessarily reset everything, just keep current state
  };

  const updateVolume = (v: number) => {
    if (process === 'isobaric') {
      // P is constant => T = PV / nR
      const newT = (state.pressure * v) / nR;
      setState({ ...state, volume: v, temperature: newT });
    } else {
      // Isothermal or Isochoric (though V is fixed in isochoric)
      // Default behavior: P = nRT / V
      const newP = (nR * state.temperature) / v;
      setState({ ...state, volume: v, pressure: newP });
    }
  };

  const updateTemperature = (t: number) => {
    if (process === 'isochoric') {
      // V is constant => P = nRT / V
      const newP = (nR * t) / state.volume;
      setState({ ...state, temperature: t, pressure: newP });
    } else if (process === 'isobaric') {
      // P is constant => V = nRT / P
      const newV = (nR * t) / state.pressure;
      setState({ ...state, temperature: t, volume: newV });
    } else {
      // Isothermal (T is constant, but if changed, we update P to keep V)
      const newP = (nR * t) / state.volume;
      setState({ ...state, temperature: t, pressure: newP });
    }
  };

  const updatePressure = (p: number) => {
    if (process === 'isochoric') {
      // V is constant => T = PV / nR
      const newT = (p * state.volume) / nR;
      setState({ ...state, pressure: p, temperature: newT });
    } else {
      // Isothermal or Isobaric (though P is fixed in isobaric)
      // Default behavior: V = nRT / P
      const newV = (nR * state.temperature) / p;
      setState({ ...state, pressure: p, volume: newV });
    }
  };

  const addMeasurement = () => {
    // Add a very small realistic error (±0.25% noise) for a smoother graph
    const addNoise = (val: number) => val * (1 + (Math.random() - 0.5) * 0.005);
    
    // Determine which variables should have noise
    // The "target" (constant) variable should NOT have noise in the table as per user request
    const noisyP = info.target === 'pressure' ? state.pressure : addNoise(state.pressure);
    const noisyV = info.target === 'volume' ? state.volume : addNoise(state.volume);
    const noisyT = info.target === 'temperature' ? state.temperature : addNoise(state.temperature);

    const constant = process === 'isothermal' ? noisyP * noisyV :
                     process === 'isobaric' ? noisyV / noisyT :
                     noisyP / noisyT;
    
    const newMeasure: Measurement = {
      id: Math.random().toString(36).substr(2, 9),
      p: noisyP,
      v: noisyV,
      t: noisyT,
      constant
    };
    setHistory([newMeasure, ...history]);
  };

  const removeMeasurement = (id: string) => {
    setHistory(history.filter(m => m.id !== id));
  };

  const getFormula = () => {
    switch (process) {
      case 'isothermal': return { name: 'Định luật Boyle', formula: 'P × V ≈ const', desc: 'Cố định Nhiệt độ (T)', target: 'temperature' };
      case 'isobaric': return { name: 'Định luật Charles', formula: 'V / T ≈ const', desc: 'Cố định Áp suất (P)', target: 'pressure' };
      case 'isochoric': return { name: 'Định luật Gay-Lussac', formula: 'P / T ≈ const', desc: 'Cố định Thể tích (V)', target: 'volume' };
    }
  };

  const info = getFormula();

  const isConstantChanged = history.length > 0 && 
    Math.abs(history[0][info.target === 'temperature' ? 't' : info.target === 'volume' ? 'v' : 'p'] - 
    (info.target === 'temperature' ? state.temperature : info.target === 'volume' ? state.volume : state.pressure)) > 0.1;

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 font-sans selection:bg-teal-100 p-4 flex flex-col gap-4">
      {/* Top Section: Sidebar + Simulation */}
      <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[65vh]">
        
        {/* Left Sidebar: Law Info & Controls */}
        <div className="w-full lg:w-1/4 flex flex-col gap-4 overflow-y-auto">
          {/* Law Info */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                <Info size={20} />
              </div>
              <h1 className="text-lg font-black tracking-tight text-slate-800">Định luật khí</h1>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <h2 className="text-teal-600 font-black text-sm mb-1">{info.name}</h2>
                <p className="text-2xl font-mono font-black text-slate-700">{info.formula}</p>
                <p className="text-[11px] text-slate-400 mt-2 font-bold uppercase tracking-wider">{info.desc}</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex-1 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Điều khiển</h2>
              <button 
                onClick={addMeasurement}
                className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-all shadow-lg shadow-teal-600/20 active:scale-95"
                title="Ghi số liệu"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-6 flex-1">
              {/* Volume Slider */}
              <div className={`space-y-3 p-3 rounded-2xl transition-all ${info.target === 'volume' ? 'bg-teal-50 ring-1 ring-teal-200' : 'bg-slate-50/50'}`}>
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thể tích (V)</label>
                  <span className="text-sm font-black text-teal-600 font-mono">{state.volume.toFixed(1)} L</span>
                </div>
                <input 
                  type="range" min="10" max="100" step="0.1" 
                  value={state.volume}
                  onChange={(e) => updateVolume(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer accent-teal-600"
                />
              </div>

              {/* Temperature Slider */}
              <div className={`space-y-3 p-3 rounded-2xl transition-all ${info.target === 'temperature' ? 'bg-rose-50 ring-1 ring-rose-200' : 'bg-slate-50/50'}`}>
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nhiệt độ (T)</label>
                  <span className="text-sm font-black text-rose-600 font-mono">{state.temperature.toFixed(1)} K</span>
                </div>
                <input 
                  type="range" min="200" max="600" step="1" 
                  value={state.temperature}
                  onChange={(e) => updateTemperature(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer accent-rose-600"
                />
              </div>

              {/* Pressure Slider */}
              <div className={`space-y-3 p-3 rounded-2xl transition-all ${info.target === 'pressure' ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'bg-slate-50/50'}`}>
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Áp suất (P)</label>
                  <span className="text-sm font-black text-indigo-600 font-mono">{state.pressure.toFixed(1)} kPa</span>
                </div>
                <input 
                  type="range" min="50" max="500" step="1" 
                  value={state.pressure}
                  onChange={(e) => updatePressure(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            <button 
              onClick={resetSimulation}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw size={14} /> Làm mới thí nghiệm
            </button>
          </div>
        </div>

        {/* Right Main: Simulation & Process Buttons */}
        <div className="w-full lg:w-3/4 flex flex-col gap-4">
          {/* Simulation Frame */}
          <div className="flex-1 bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden relative min-h-[400px]">
            <Simulation2D state={state} />
            
            {/* Dashboard Overlay - Vertical Column on the Left */}
            <div className="absolute top-10 left-10 pointer-events-none">
              <Dashboard 
                pressure={state.pressure} 
                volume={state.volume} 
                temperature={state.temperature} 
              />
            </div>
          </div>

          {/* Process Buttons - Below Simulation */}
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex justify-center gap-4">
            <button 
              onClick={() => handleProcessChange('isothermal')}
              className={`px-8 py-3 rounded-xl font-black text-sm transition-all ${process === 'isothermal' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20 scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
            >
              Đẳng nhiệt
            </button>
            <button 
              onClick={() => handleProcessChange('isobaric')}
              className={`px-8 py-3 rounded-xl font-black text-sm transition-all ${process === 'isobaric' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20 scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
            >
              Đẳng áp
            </button>
            <button 
              onClick={() => handleProcessChange('isochoric')}
              className={`px-8 py-3 rounded-xl font-black text-sm transition-all ${process === 'isochoric' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20 scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
            >
              Đẳng tích
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Data & Charts */}
      <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[30vh]">
        {/* Data Table */}
        <div className="w-full lg:w-1/3 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <TableIcon size={16} className="text-teal-600" /> Bảng số liệu
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100">
              {history.length} lần đo
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white/90 backdrop-blur-sm z-10">
                <tr className="border-b border-slate-100">
                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase">STT</th>
                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase">P</th>
                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase">V</th>
                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase">T</th>
                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase">K</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.map((m, idx) => (
                  <tr key={m.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-xs font-bold text-slate-400">{history.length - idx}</td>
                    <td className="p-3 text-xs font-black text-indigo-600">{m.p.toFixed(1)}</td>
                    <td className="p-3 text-xs font-black text-teal-600">{m.v.toFixed(1)}</td>
                    <td className="p-3 text-xs font-black text-rose-600">{m.t.toFixed(1)}</td>
                    <td className="p-3 text-xs font-mono font-bold text-slate-500">{m.constant.toFixed(3)}</td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => removeMeasurement(m.id)}
                        className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs italic">Chưa có dữ liệu</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
            <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Đồ thị P-V
            </h4>
            <div className="flex-1 min-h-[150px]">
              <GasChart data={history} type="PV" process={process} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
            <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Đồ thị V-T
            </h4>
            <div className="flex-1 min-h-[150px]">
              <GasChart data={history} type="VT" process={process} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
            <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Đồ thị P-T
            </h4>
            <div className="flex-1 min-h-[150px]">
              <GasChart data={history} type="PT" process={process} />
            </div>
          </div>
        </div>
      </div>

      {/* Warnings & Notes */}
      {isConstantChanged && (
        <div className="fixed bottom-6 right-6 max-w-xs p-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-2xl flex items-start gap-3 text-amber-700 text-[11px] font-bold animate-bounce z-50">
          <Info size={16} className="shrink-0 mt-0.5" />
          <p>Đại lượng cố định đã bị thay đổi! Điều này sẽ làm gãy khúc đồ thị. Hãy nhấn "Làm mới" để bắt đầu lại.</p>
        </div>
      )}
    </div>
  );
}
