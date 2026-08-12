import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { CHART_DATA } from '../data/mockData'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl px-3 py-2.5 text-xs shadow-lg"
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
      }}
    >
      <div className="text-slate-500 mb-2 font-semibold">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1 last:mb-0">
          <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-mono font-bold text-slate-800">{p.value} U</span>
        </div>
      ))}
    </div>
  )
}

const CustomLegend = ({ payload }: any) => (
  <div className="flex items-center gap-4 justify-end mt-1 mb-0">
    {payload?.map((entry: any) => (
      <div key={entry.value} className="flex items-center gap-1.5">
        <span
          className="inline-block flex-shrink-0"
          style={{
            width: 10,
            height: entry.value === 'Stock de Sécurité' ? 2 : 10,
            background: entry.color,
            borderRadius: 2,
          }}
        />
        <span className="text-slate-500 text-xs">{entry.value}</span>
      </div>
    ))}
  </div>
)

export default function SalesChart() {
  return (
    <div className="surface-card p-5 h-full flex flex-col shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-700 text-sm font-bold">Ventes Journalières — 7 derniers jours</h3>
        <div className="flex gap-1.5">
          {['7J', '14J', '30J'].map((p) => (
            <button
              key={p}
              className="text-xs px-2 py-0.5 rounded-lg transition-colors font-medium"
              style={{
                background: p === '7J' ? '#0284c7' : '#f8fafc',
                color: p === '7J' ? '#fff' : '#94a3b8',
                border: '1px solid',
                borderColor: p === '7J' ? '#0284c7' : '#e2e8f0',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1" style={{ minHeight: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={CHART_DATA} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
              domain={[0, 1100]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(2,132,199,0.05)' }} />
            <Legend content={<CustomLegend />} />
            <Bar
              dataKey="ventes"
              name="Ventes Journalières"
              fill="#0284c7"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
              fillOpacity={0.9}
            />
            <Line
              dataKey="stockSec"
              name="Stock de Sécurité"
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={{ fill: '#94a3b8', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 4, fill: '#475569' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
