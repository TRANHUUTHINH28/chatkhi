import React from 'react';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ReferenceLine } from 'recharts';
import { Measurement, GasProcess } from '../types';

interface GasChartProps {
  data: Measurement[];
  type: 'PV' | 'VT' | 'PT';
  process: GasProcess;
}

export const GasChart: React.FC<GasChartProps> = ({ data, type, process }) => {
  const chartData = [...data].sort((a, b) => {
    if (type === 'PV') return a.v - b.v;
    return a.t - b.t;
  });

  const getAxisLabels = () => {
    switch (type) {
      case 'PV': return { x: 'v', y: 'p', xLabel: 'V (L)', yLabel: 'P (kPa)' };
      case 'VT': return { x: 't', y: 'v', xLabel: 'T (K)', yLabel: 'V (L)' };
      case 'PT': return { x: 't', y: 'p', xLabel: 'T (K)', yLabel: 'P (kPa)' };
    }
  };

  const labels = getAxisLabels();

  if (data.length < 1) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 text-[10px] italic border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
        Đợi dữ liệu...
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey={labels.x} 
            type="number" 
            domain={[0, 'auto']} 
            tick={{ fontSize: 9 }}
            label={{ value: labels.xLabel, position: 'insideBottomRight', offset: -5, fontSize: 9, fontWeight: 'bold' }}
          />
          <YAxis 
            dataKey={labels.y} 
            type="number" 
            domain={[0, 'auto']}
            tick={{ fontSize: 9 }}
            label={{ value: labels.yLabel, angle: -90, position: 'insideLeft', offset: 10, fontSize: 9, fontWeight: 'bold' }}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
            labelFormatter={(value) => `${labels.xLabel}: ${Number(value).toFixed(1)}`}
          />
          
          {/* Theoretical line for linear relationships */}
          {((type === 'VT' && process === 'isobaric') || (type === 'PT' && process === 'isochoric')) && (
            <ReferenceLine 
              segment={[{ x: 0, y: 0 }, { x: chartData[chartData.length - 1][labels.x as keyof Measurement] as number, y: chartData[chartData.length - 1][labels.y as keyof Measurement] as number }]} 
              stroke="#cbd5e1" 
              strokeDasharray="3 3" 
            />
          )}

          <Line 
            type={type === 'PV' ? "monotone" : "linear"} 
            dataKey={labels.y} 
            stroke="#0d9488" 
            strokeWidth={2} 
            dot={{ r: 3, fill: '#0d9488', strokeWidth: 1, stroke: '#fff' }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
