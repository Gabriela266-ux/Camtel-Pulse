import React, { useState } from 'react';
import { Activity } from 'lucide-react';
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

  // Index date -> enregistrement pour un accès O(1) aux relevés journaliers réels.
  const recordsByDate = new Map(records.map((record) => [record.date, record]));

  // La période se termine sur le dernier relevé disponible. Une saisie historique reste
  // ainsi visible, même si elle ne se trouve pas dans les 7 derniers jours calendaires.
  const latestRecordDate = [...records]
    .map((record) => record.date)
    .sort((left, right) => left.localeCompare(right))
    .at(-1);
  const endDate = latestRecordDate
    ? new Date(`${latestRecordDate}T00:00:00`)
    : new Date();
  endDate.setHours(0, 0, 0, 0);
  const lastDates: string[] = [];
  for (let i = period - 1; i >= 0; i -= 1) {
    const day = new Date(endDate);
    day.setDate(endDate.getDate() - i);
    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, '0');
    const date = String(day.getDate()).padStart(2, '0');
    lastDates.push(`${year}-${month}-${date}`);
  }

  // La consommation est calculée et renvoyée par le backend avec la même règle que le
  // tableau. Le graphique ne refait pas un calcul différent côté navigateur.
  const chartData = lastDates.map((date) => {
    const record = recordsByDate.get(date);

    return {
      date: `${date.slice(8, 10)}/${date.slice(5, 7)}`,
      consommation: record?.consommation ?? null,
      stockSecurite,
    };
  });

  const hasKnownConsumption = chartData.some((item) => item.consommation !== null);

  // Achat cumulé réel sur la période sélectionnée (somme des achats enregistrés).
  const totalAchatPeriod = [...recordsByDate.values()]
    .filter((record) => lastDates.includes(record.date))
    .reduce((sum, record) => sum + (record.achat ?? 0), 0);

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
          <h3 className={`flex items-center gap-2 text-sm font-black ${titleClass}`}>
            <Activity className="h-4 w-4 text-sky-600" aria-hidden="true" />
            Consommation — {period} derniers jours
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Consommation = Stock j + Achat j − Stock j+1 (données calculées par le serveur)
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

      <div className="relative h-72 w-full">
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
        {!hasKnownConsumption && (
          <div className={`pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
            La consommation nécessite le stock du jour suivant. Saisissez les stocks de deux jours consécutifs.
          </div>
        )}
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
