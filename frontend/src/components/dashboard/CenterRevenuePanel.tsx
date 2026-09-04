import React, { useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface CentreRevenue {
  id: string;
  nom: string;
  code: string;
  monthly: Array<{ month: string; montant: number }>;
  total: number;
}

interface CenterRevenuePanelProps {
  data: { months: string[]; centres: CentreRevenue[]; criticalCases: Array<{ type: string; nom: string; centre: string; message: string }> } | null;
  isDark: boolean;
}

const colors = ['#0284c7', '#f59e0b', '#10b981', '#e11d48', '#7c3aed', '#0891b2'];

export const CenterRevenuePanel: React.FC<CenterRevenuePanelProps> = ({ data, isDark }) => {
  const [showGlobalView, setShowGlobalView] = useState(false);
  if (!data) return null;
  const chartData = data.months.map((month, index) => Object.fromEntries([
    ['month', month.slice(5)],
    ...data.centres.map((centre) => [centre.id, centre.monthly[index]?.montant ?? 0]),
  ]));
  const currentMonth = data.months.at(-1);

  return (
    <section className={`rounded-2xl border p-5 shadow-sm ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-sky-600">Pilotage financier</p>
          <h2 className={`mt-1 text-xl font-black ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Chiffre d’affaires par centre</h2>
          <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Évolution des montants réalisés sur les six derniers mois.</p>
        </div>
        <button type="button" onClick={() => setShowGlobalView((visible) => !visible)} className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-950/70"><TrendingUp className="h-4 w-4" /> {showGlobalView ? 'Masquer la vue globale' : 'Vue globale'}</button>
      </div>

      <div className="mt-5 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={isDark ? '#334155' : '#dbeafe'} />
            <XAxis dataKey="month" tickLine={false} tick={{ fontSize: 11, fill: isDark ? '#cbd5e1' : '#64748b' }} />
            <YAxis tickLine={false} tick={{ fontSize: 11, fill: isDark ? '#cbd5e1' : '#64748b' }} />
            <Tooltip formatter={(value) => `${Number(value || 0).toLocaleString('fr-FR')} FCFA`} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
            {data.centres.map((centre, index) => <Line key={centre.id} type="monotone" dataKey={centre.id} name={centre.nom} stroke={colors[index % colors.length]} strokeWidth={3} dot={{ r: 3 }} />)}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.centres.map((centre, index) => {
          const current = centre.monthly.find((item) => item.month === currentMonth)?.montant ?? 0;
          return <div key={centre.id} className={`rounded-xl border p-3 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}><div className="flex items-center gap-2 text-xs font-bold"><BarChart3 className="h-4 w-4" style={{ color: colors[index % colors.length] }} />{centre.nom}</div><p className={`mt-2 text-lg font-black ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{current.toLocaleString('fr-FR')} FCFA</p><p className="text-[11px] text-slate-500">Mois en cours · Cumul 6 mois : {centre.total.toLocaleString('fr-FR')} FCFA</p></div>;
        })}
      </div>
      {showGlobalView && (
        <div className={`mt-5 rounded-xl border p-4 ${isDark ? 'border-rose-900/60 bg-rose-950/20' : 'border-rose-200 bg-rose-50'}`}>
          <div className="flex items-center justify-between gap-3"><h3 className={`text-sm font-black ${isDark ? 'text-rose-200' : 'text-rose-800'}`}>Cas critiques à surveiller</h3><span className={`rounded-full px-2 py-1 text-xs font-bold ${isDark ? 'bg-rose-900/50 text-rose-200' : 'bg-white text-rose-700'}`}>{data.criticalCases.length}</span></div>
          {data.criticalCases.length > 0 ? <ul className="mt-3 space-y-2">{data.criticalCases.map((item) => <li key={`${item.type}-${item.nom}`} className={`flex flex-wrap justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${isDark ? 'border-rose-900/60 text-rose-100' : 'border-rose-200 text-rose-800'}`}><span className="font-black">{item.nom}</span><span>{item.type} · {item.centre} · {item.message}</span></li>)}</ul> : <p className={`mt-3 text-xs ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Aucun cas critique détecté sur les centres.</p>}
        </div>
      )}
    </section>
  );
};