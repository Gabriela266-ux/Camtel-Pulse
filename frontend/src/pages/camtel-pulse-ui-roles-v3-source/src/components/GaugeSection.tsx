interface GaugeProps {
  label: string
  sublabel: string
  value: number
  target: number
  unit?: string
}

function LinearGauge({ label, sublabel, value, target, unit = 'U' }: GaugeProps) {
  const pct = Math.min(Math.max((value / (target || 1)) * 100, 0), 100)
  const over = value >= target
  const barColor = pct >= 100 ? '#15803d' : pct >= 80 ? '#0284c7' : '#dc2626'

  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-baseline justify-between mb-1.5">
        <div>
          <span className="text-slate-700 text-xs font-semibold">{label}</span>
          <span className="text-slate-400 text-xs ml-1.5">{sublabel}</span>
        </div>
        <div className="text-right">
          <span className="font-mono text-sm font-bold" style={{ color: barColor }}>
            {value.toLocaleString('fr-FR')}
          </span>
          <span className="text-slate-400 text-xs ml-1">/ {target.toLocaleString('fr-FR')} {unit}</span>
        </div>
      </div>

      <div className="gauge-track">
        <div className="gauge-fill" style={{ width: `${pct}%`, background: barColor }} />
      </div>

      <div className="flex justify-between mt-1">
        <span className="text-xs text-slate-300 font-mono">0</span>
        <span className="text-xs font-mono font-semibold" style={{ color: over ? '#15803d' : '#dc2626' }}>
          {over ? '+' : ''}{(value - target).toLocaleString('fr-FR')} {unit}
        </span>
        <span className="text-xs font-mono" style={{ color: barColor }}>{Math.round(pct)}%</span>
      </div>
    </div>
  )
}

export default function GaugeSection() {
  return (
    <div className="surface-card p-5 h-full flex flex-col shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-slate-700 text-sm font-bold">Progression Objectifs</h3>
        <span className="text-slate-400 text-xs">11 août 2026</span>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <LinearGauge label="Seuil du Jour" sublabel="vs Réalisé" value={640} target={850} unit="U" />
        <LinearGauge label="Seuil Cumulé" sublabel="vs Cumul Réalisé" value={9145} target={9350} unit="U" />
        <LinearGauge label="Stock de Sécurité" sublabel="vs Optimal" value={290} target={400} unit="U" />
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2 flex-wrap">
        <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: '#fee2e2', color: '#dc2626' }}>
          ! 3 objectifs en déficit
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: '#dcfce7', color: '#15803d' }}>
          ✓ 0 dépassement
        </span>
      </div>
    </div>
  )
}
