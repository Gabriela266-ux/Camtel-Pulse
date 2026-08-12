import { DAILY_RECORDS, type StatusType } from '../data/mockData'
import { type RoleProfile } from '../auth/roleConfig'

function StatusBadge({ status }: { status: StatusType }) {
  const ok = status === 'NORMAL'
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{
        background: ok ? '#dcfce7' : '#fee2e2',
        color: ok ? '#15803d' : '#dc2626',
        border: `1px solid ${ok ? '#bbf7d0' : '#fecaca'}`,
      }}
    >
      {ok ? '✓' : '!'} {status}
    </span>
  )
}

function Delta({ value }: { value: number }) {
  const pos = value >= 0
  return (
    <span className="font-mono text-xs font-semibold" style={{ color: pos ? '#15803d' : '#dc2626' }}>
      {pos ? '+' : ''}{value.toLocaleString('fr-FR')}
    </span>
  )
}

interface TrackingTableProps {
  profile: RoleProfile
  onNewEntry: () => void
}

export default function TrackingTable({ profile, onNewEntry }: TrackingTableProps) {
  const fmt = (d: string) => {
    const [y, m, day] = d.split('-')
    return `${day}/${m}/${y}`
  }

  return (
    <div className="surface-card overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <h3 className="text-slate-700 text-sm font-bold">Suivi journalier</h3>
          <span className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold" style={{ background: '#f1f5f9', color: '#64748b' }}>
            11 enreg.
          </span>
          <span className="text-xs text-slate-400">Calendrier mensuel exportable</span>
        </div>
        <div className="flex items-center gap-2">
          {profile.canCreateEntry && (
            <button
              onClick={onNewEntry}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:brightness-110 active:scale-95"
              style={{ background: '#0284c7', color: '#fff' }}
            >
              + Saisie journalière
            </button>
          )}
          {profile.canExport ? (
            <>
              <button
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors hover:brightness-105"
                style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}
              >
                ⬇ XLS
              </button>
              <button
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors hover:brightness-105"
                style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}
              >
                ⬇ PDF
              </button>
            </>
          ) : (
            <span
              className="text-xs px-3 py-1.5 rounded-lg font-semibold"
              style={{ background: profile.surface, color: profile.tone, border: `1px solid ${profile.tone}22` }}
            >
              Saisie uniquement
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Date', 'Prévision / CA(U)', 'Réalisation / VA(U)', 'Cumul Achat (U)', 'Écart Stock Sec (U)', 'Écart Jour', 'Écart Cumulé', 'Statut'].map((col) => (
                <th
                  key={col}
                  className="text-left py-2.5 px-4 font-semibold uppercase tracking-wide"
                  style={{ fontSize: 10, color: '#94a3b8', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...DAILY_RECORDS].reverse().map((rec, i) => {
              const isToday = rec.date === '2026-08-11'
              return (
                <tr
                  key={rec.date}
                  className="tr-hover transition-colors duration-75"
                  style={{
                    background: isToday ? '#f0f7ff' : i % 2 === 0 ? '#ffffff' : '#fafafa',
                    borderLeft: isToday ? '3px solid #0284c7' : '3px solid transparent',
                  }}
                >
                  <td className="py-2.5 px-4 font-mono" style={{ color: isToday ? '#0284c7' : '#64748b', whiteSpace: 'nowrap' }}>
                    {fmt(rec.date)}
                    {isToday && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: '#bae6fd', color: '#0284c7', fontSize: 9 }}>
                        AUJOURD&apos;HUI
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-400">{rec.prevision}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-700 font-semibold">{rec.realisationVa}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-600">{rec.cumulAchat.toLocaleString('fr-FR')}</td>
                  <td
                    className="py-2.5 px-4 font-mono font-semibold"
                    style={{ color: rec.stockJournalier >= 400 ? '#15803d' : rec.stockJournalier >= 300 ? '#d97706' : '#dc2626' }}
                  >
                    {rec.stockJournalier}
                  </td>
                  <td className="py-2.5 px-4"><Delta value={rec.ecartStockSec} /></td>
                  <td className="py-2.5 px-4"><Delta value={rec.ecartCumul} /></td>
                  <td className="py-2.5 px-4"><StatusBadge status={rec.status} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-2.5 flex items-center justify-between text-xs border-t border-slate-100" style={{ color: '#94a3b8' }}>
        <span>
          Affichage : 11 sur 11 enregistrements · {profile.readOnly ? 'consultation uniquement' : profile.scopeLabel}
        </span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block bg-green-500" />7 NORMAL
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block bg-red-500" />4 CRITIQUE
          </span>
        </span>
      </div>
    </div>
  )
}
