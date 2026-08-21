import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DailyRecord } from '../../types';

interface ConsumptionChartProps {
  records: DailyRecord[];
  stockSecurite?: number;
  isDark?: boolean;
}

export const ConsumptionChart: React.FC<ConsumptionChartProps> = ({
  records,
  stockSecurite = 0,
  isDark = false,
}) => {
  const [period, setPeriod] = useState<7 | 14 | 30>(7);

  const visibleRecords = records.slice(-period);

  // Achat cumulé réel sur la période sélectionnée (somme des achats enregistrés).
  const totalAchatPeriod = visibleRecords.reduce(
    (sum, record) => sum + (record.achat ?? 0),
    0,
  );

  const chartData = visibleRecords.map((record) => ({
    date: record.date.split('-')[2],
    // Consommation (n) = Stock jour (n-1) + Réalisation jour (n-1) − Stock jour (n).
    // L'endpoint backend (/dashboard/records) renvoie déjà ce calcul réel (champ `consommation`) ;
    // on l'utilise tel quel, aucune valeur factice n'est injectée.
    consommation: record.consommation ?? 0,
    stockSecurite,
  }));

  const sectionClass = isDark
    ? 'rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-lg'
    : 'rounded-2xl border border-slate-200 bg-gradient-to-b from-sky-50 to-white p-5 shadow-sm';
  const titleClass = isDark ? 'text-white' : 'text-slate-800';
  const chipClass = isDark ? 'bg-slate-800' : 'bg-slate-100';
  const activeChipClass = isDark ? 'bg-slate-700 text-white' : 'bg-white font-bold text-slate-900';
  const btnClass = isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50';
  const axisText = isDark ? '#cbd5e1' : '#64748b';
  const gridStroke = isDark ? '#334155' : '#dbeafe';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';

  return (
    <section className={sectionClass}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className={`text-sm font-black ${titleClass}`}>
            📊 Consommation — {period} derniers jours
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Consommation = Stock j−1 + Achat j−1 − Stock j (données réelles des relevés)
          </p>
        </div>

        <div className={`flex items-center gap-1.5 rounded-xl p-2 ${chipClass}`}>
          {(
            [
              { label: '7J', value: 7 },
              { label: '14J', value: 14 },
              { label: '30J', value: 30 },
            ] as const
          ).map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setPeriod(item.value)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                period === item.value ? activeChipClass : btnClass
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={gridStroke} />
            <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 12, fill: axisText, fontWeight: 500 }} />
            <YAxis tickLine={false} tick={{ fontSize: 12, fill: axisText, fontWeight: 500 }} width={40} />
            <Tooltip
              cursor={{ fill: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.12)' }}
              isAnimationActive={false}
              shared
              contentStyle={{
                backgroundColor: tooltipBg,
                border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.3)' : '0 10px 30px rgba(15, 23, 42, 0.1)',
                color: isDark ? '#ffffff' : '#1e293b',
                padding: '8px 12px',
              }}
              labelStyle={{ fontWeight: 'bold', fontSize: '13px', color: isDark ? '#ffffff' : '#1e293b' }}
              formatter={(value) => `${typeof value === 'number' ? value.toLocaleString('fr-FR') : value} U`}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '12px', fontWeight: 500 }} 
              iconType="square"
            />
            <Bar dataKey="consommation" name="Consommation" fill="#0284c7" radius={[6, 6, 0, 0]} />
            <Bar dataKey="stockSecurite" name="Stock de sécurité" fill="#f59e0b" radius={[6, 6, 0, 0]} opacity={0.35} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-xs ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
        <span className={isDark ? 'text-slate-300' : 'text-slate-500'}>
          Achat cumulé · {period} derniers jours
        </span>
        <span className={`font-mono font-black ${isDark ? 'text-sky-300' : 'text-sky-600'}`}>
          {totalAchatPeriod.toLocaleString('fr-FR')} U
        </span>
      </div>
    </section>
  );
};
