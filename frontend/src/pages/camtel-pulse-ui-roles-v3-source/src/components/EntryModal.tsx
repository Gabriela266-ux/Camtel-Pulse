import { useState } from 'react'
import { NETWORK_TREE, type TreeNode } from '../data/mockData'
import { ROLE_PROFILES, type Role } from '../auth/roleConfig'

interface EntryModalProps {
  onClose: () => void
  defaultDate: string
  role: Role
}

interface HistoryEntry {
  timestamp: string
  user: string
  oldValue: number
  newValue: number
}

const MOCK_HISTORY: HistoryEntry[] = [
  { timestamp: '10/08/2026 18:32', user: 'M. Atangana', oldValue: 920, newValue: 910 },
  { timestamp: '09/08/2026 19:01', user: 'M. Atangana', oldValue: 780, newValue: 760 },
]

function flattenPOS(node: TreeNode, prefix = ''): { id: string; label: string; path: string }[] {
  if (node.type === 'pos') return [{ id: node.id, label: node.label, path: prefix }]
  const result: { id: string; label: string; path: string }[] = []
  for (const child of node.children ?? []) {
    const childPrefix = prefix ? `${prefix} › ${child.label}` : child.label
    result.push(...flattenPOS(child, childPrefix))
  }
  return result
}

const ALL_POS = flattenPOS(NETWORK_TREE)
const OPERATIONAL_POS = flattenPOS(NETWORK_TREE.children?.find((node) => node.id === 'glotelho') ?? NETWORK_TREE)
const OPERATIONAL_PARTNERS = [{ id: 'glotelho', label: 'Glotelho (Master SIM 1)', path: 'Centre 1 CDPSM › Glotelho (Master SIM 1)' }]
const MAX_CORRECTIONS = 5

export default function EntryModal({ onClose, defaultDate, role }: EntryModalProps) {
  const visibleEntities = role === 'Opérationnel'
    ? OPERATIONAL_POS.length > 0 ? OPERATIONAL_POS : OPERATIONAL_PARTNERS
    : ALL_POS.length > 0 ? ALL_POS : OPERATIONAL_PARTNERS
  const [entity, setEntity] = useState(visibleEntities[0]?.id ?? '')
  const [date, setDate] = useState(defaultDate)
  const [stockJournalier, setStockJournalier] = useState('')
  const [realisationVa, setRealisationVa] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [correctionReason, setCorrectionReason] = useState('')
  const [showCorrectionForm, setShowCorrectionForm] = useState(false)
  const correctionCount = MOCK_HISTORY.length
  const isLocked = correctionCount >= MAX_CORRECTIONS
  const profile = ROLE_PROFILES[role]
  const selectedEntity = visibleEntities.find((p) => p.id === entity)
  const expectedVa = 850

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!stockJournalier || !realisationVa) return
    setSubmitted(true)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl flex flex-col"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0"
          style={{ background: '#f8fafc', borderRadius: '16px 16px 0 0' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: '#e0f2fe' }}
            >
              <span className="text-base">📝</span>
            </div>
            <div>
              <h2 className="text-slate-800 font-bold text-sm">Saisie Journalière</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                {profile.label} · {profile.scopeLabel}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {submitted ? (
            <div className="text-center py-8">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: '#dcfce7' }}
              >
                <span className="text-green-600 text-2xl">✓</span>
              </div>
              <h3 className="text-slate-800 font-bold mb-2">Saisie enregistrée</h3>
              <p className="text-slate-500 text-xs mb-1">
                Stock journalier <strong className="text-slate-700">{stockJournalier} U</strong> et Réalisation/VA{' '}
                <strong className="text-slate-700">{realisationVa} U</strong> pour le{' '}
                <strong className="text-slate-700">{date}</strong>
              </p>
              <p className="text-slate-400 text-xs">{selectedEntity?.path}</p>
              <button
                onClick={onClose}
                className="mt-6 text-xs px-5 py-2 rounded-lg font-semibold shadow-sm"
                style={{ background: '#0284c7', color: '#fff' }}
              >
                Fermer
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-slate-600 text-xs font-semibold block mb-1.5">
                  Entité affectée <span className="text-red-500">*</span>
                </label>
                <select
                  value={entity}
                  onChange={(e) => setEntity(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-300 appearance-none"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }}
                >
                  {visibleEntities.map((p) => (
                    <option key={p.id} value={p.id}>{p.path}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-600 text-xs font-semibold block mb-1.5">
                  Date de référence <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-300"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', colorScheme: 'light' }}
                />
              </div>

              <div>
                <label className="text-slate-600 text-xs font-semibold block mb-1.5">
                  Stock journalier (U) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    placeholder="ex: 290"
                    value={stockJournalier}
                    onChange={(e) => setStockJournalier(e.target.value)}
                    className="w-full text-sm py-2.5 px-3 pr-10 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-sky-300"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">U</span>
                </div>
              </div>

              <div>
                <label className="text-slate-600 text-xs font-semibold block mb-1.5">
                  Réalisation / VA(U) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    placeholder="ex: 640"
                    value={realisationVa}
                    onChange={(e) => setRealisationVa(e.target.value)}
                    className="w-full text-sm py-2.5 px-3 pr-10 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-sky-300"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">U</span>
                </div>
                {realisationVa && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="gauge-track flex-1">
                      <div
                        className="gauge-fill"
                        style={{
                          width: `${Math.min((Number(realisationVa) / expectedVa) * 100, 100)}%`,
                          background: Number(realisationVa) >= expectedVa ? '#15803d' : '#0284c7',
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-500">
                      {Math.round((Number(realisationVa) / expectedVa) * 100)}% prévision
                    </span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!stockJournalier || !realisationVa}
                className="w-full text-sm font-semibold py-2.5 px-4 rounded-lg transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                style={{ background: '#0284c7', color: '#fff' }}
              >
                Enregistrer la saisie journalière
              </button>
            </form>
          )}

          {/* Historique */}
          {!submitted && (
            <div className="mt-6">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 text-xs font-semibold">Historique des corrections</span>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full font-mono font-bold"
                    style={{
                      background: correctionCount >= 4 ? '#fee2e2' : '#f1f5f9',
                      color: correctionCount >= 4 ? '#dc2626' : '#64748b',
                    }}
                  >
                    {correctionCount}/{MAX_CORRECTIONS}
                  </span>
                </div>
                {isLocked && (
                  <button
                    onClick={() => setShowCorrectionForm((s) => !s)}
                    className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                    style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}
                  >
                    ⚑ Demande correction
                  </button>
                )}
              </div>

              {MOCK_HISTORY.length === 0 ? (
                <p className="text-slate-400 text-xs italic">Aucune correction effectuée.</p>
              ) : (
                <div className="space-y-2">
                  {MOCK_HISTORY.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 text-xs p-2.5 rounded-lg"
                      style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                    >
                      <span className="text-slate-400 mt-0.5">↩</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-slate-700 font-semibold">{h.user}</span>
                          <span className="text-slate-400">{h.timestamp}</span>
                        </div>
                        <span className="text-slate-500">
                          <span className="font-mono text-slate-400 line-through">{h.oldValue} U</span>
                          {' → '}
                          <span className="font-mono text-slate-700 font-semibold">{h.newValue} U</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showCorrectionForm && (
                <div
                  className="mt-4 p-4 rounded-xl space-y-3"
                  style={{ background: '#fff1f2', border: '1px solid #fecaca' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">⚑</span>
                    <span className="text-red-700 text-xs font-semibold">Demande de correction (Workflow 48h)</span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Motif de la demande de correction…"
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                    style={{ background: '#fff', border: '1px solid #fecaca', color: '#0f172a' }}
                  />
                  <button
                    disabled={!correctionReason.trim()}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-40"
                    style={{ background: '#dc2626', color: '#fff' }}
                  >
                    Envoyer la demande
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
