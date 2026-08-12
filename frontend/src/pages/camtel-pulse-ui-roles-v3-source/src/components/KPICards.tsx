import { KPI_DATA } from '../data/mockData'

interface KPICardProps {
  label: string
  value: number
  delta: number
  unit: string
  target: number
  icon: string
  invert?: boolean
}

function KPICard({ label, value, delta, unit, target, icon, invert = false }: KPICardProps) {
  const isPositive = invert ? delta <= 0 : delta >= 0
  const deltaColor = isPositive ? '#15803d' : '#dc2626'
  const deltaBg = isPositive ? '#dcfce7' : '#fee2e2'
  const deltaSign = delta >= 0 ? '+' : ''
  const progress = target > 0 ? Math.min(Math.max((value / target) * 100, 0), 100) : 0
  const barColor = progress >= 100 ? '#15803d' : progress >= 80 ? '#0284c7' : '#dc2626'

  return (
    <div
      className="surface-card p-4 flex flex-col gap-3 shadow-sm"
      style={{ flex: '1 1 160px' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="text-base w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: '#e0f2fe' }}
          >
            {icon}
          </span>
          <span className="text-slate-500 text-xs font-medium leading-snug">{label}</span>
        </div>
        <span
          className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{ color: deltaColor, background: deltaBg }}
        >
          {deltaSign}{delta} {unit}
        </span>
      </div>

      <div>
        <span
          className="font-mono font-bold leading-none text-slate-800"
          style={{ fontSize: 24 }}
        >
          {value.toLocaleString('fr-FR')}
        </span>
        <span className="text-slate-400 text-xs ml-1">{unit}</span>
      </div>

      {target > 0 && (
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Objectif : {target.toLocaleString('fr-FR')} {unit}</span>
            <span className="font-mono font-semibold" style={{ color: barColor }}>{Math.round(progress)}%</span>
          </div>
          <div className="gauge-track">
            <div className="gauge-fill" style={{ width: `${progress}%`, background: barColor }} />
          </div>
        </div>
      )}
    </div>
  )
}

export default function KPICards() {
  return (
    <div className="flex gap-3 flex-wrap">
      <KPICard {...KPI_DATA.venteJour} icon="📦" />
      <KPICard {...KPI_DATA.achatsCumules} icon="🛒" />
      <KPICard {...KPI_DATA.stockSecurite} icon="🏪" />
      <KPICard
        label="Écart Journalier"
        value={Math.abs(KPI_DATA.ecartJournalier.value)}
        delta={KPI_DATA.ecartJournalier.delta}
        unit="U"
        target={0}
        icon="📉"
        invert
      />
      <KPICard
        label="Écart Cumulé"
        value={Math.abs(KPI_DATA.ecartCumule.value)}
        delta={KPI_DATA.ecartCumule.delta}
        unit="U"
        target={0}
        icon="📊"
        invert
      />
    </div>
  )
}
