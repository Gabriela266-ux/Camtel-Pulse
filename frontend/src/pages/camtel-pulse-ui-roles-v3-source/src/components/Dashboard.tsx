import KPICards from './KPICards'
import GaugeSection from './GaugeSection'
import SalesChart from './SalesChart'
import TrackingTable from './TrackingTable'
import { type RoleProfile } from '../auth/roleConfig'

interface DashboardProps {
  profile: RoleProfile
  onNewEntry: () => void
}

function RoleWorkspace({ profile }: { profile: RoleProfile }) {
  const modules = profile.adminTools
    ? [
        { title: 'Utilisateurs', value: '18 actifs', detail: 'Demandes à valider sous 72 h' },
        { title: 'Réseau POS', value: '2 actions', detail: 'Réaffectation POS, fusion DSM' },
        { title: 'Audit', value: '143 traces', detail: 'Imports, objectifs, accès sensibles' },
      ]
    : profile.correctionValidation
      ? [
          { title: 'Corrections', value: '3 en attente', detail: 'Validation Chef opérationnel sous 48 h' },
          { title: 'Opérationnels', value: '6 affectés', detail: 'Glotelho et Master Color' },
          { title: 'Alertes terrain', value: '2 critiques', detail: 'POS à suivre aujourd’hui' },
        ]
      : profile.readOnly
        ? [
            { title: 'Restitution', value: 'Lecture seule', detail: 'Aucune saisie ni modification autorisée' },
            { title: 'Alertes', value: '4 signaux', detail: 'Vue consolidée pour décision' },
            { title: 'Exports', value: 'XLS / PDF', detail: 'Reporting et réunion de pilotage' },
          ]
        : [
            { title: 'Périmètre', value: 'Glotelho', detail: 'Saisie limitée au partenaire affecté' },
            { title: 'Réalisation', value: 'À saisir', detail: 'Vente du jour et suivi de correction' },
            { title: 'Corrections', value: '2/5', detail: 'Au-delà, demande validée par le chef' },
          ]

  return (
    <div
      className="surface-card p-4 shadow-sm"
      style={{ borderLeft: `4px solid ${profile.tone}` }}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-slate-800 text-sm font-bold">{profile.dashboardTitle}</h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: profile.surface, color: profile.tone }}
            >
              {profile.label}
            </span>
          </div>
          <p className="text-slate-500 text-xs">{profile.description}</p>
        </div>
        <span className="text-xs text-slate-400 whitespace-nowrap">{profile.scopeLabel}</span>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {modules.map((module) => (
          <div
            key={module.title}
            className="rounded-xl px-3 py-2.5"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
          >
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wide">{module.title}</div>
            <div className="text-slate-800 text-sm font-bold mt-1">{module.value}</div>
            <div className="text-slate-500 text-xs mt-0.5">{module.detail}</div>
          </div>
        ))}
      </div>

      {profile.correctionValidation && (
        <div
          className="mt-3 grid gap-3"
          style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
        >
          {[
            { name: 'M. Atangana', partner: 'Glotelho', status: 'Affecté' },
            { name: 'Mme Ngono', partner: 'Master Color', status: 'Affecté' },
          ].map((assignment) => (
            <div
              key={assignment.name}
              className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
              style={{ background: '#faf5ff', border: '1px solid #ddd6fe' }}
            >
              <div>
                <div className="text-slate-800 text-xs font-bold">{assignment.name}</div>
                <div className="text-slate-500 text-xs">Gère le partenaire {assignment.partner}</div>
              </div>
              <button
                type="button"
                className="text-xs px-2.5 py-1.5 rounded-lg font-semibold"
                style={{ background: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd' }}
              >
                Changer poste
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Dashboard({ profile, onNewEntry }: DashboardProps) {
  return (
    <div className="flex flex-col gap-4 p-5 overflow-y-auto flex-1 min-h-0" style={{ background: '#f0f4f8' }}>
      <RoleWorkspace profile={profile} />

      {/* Alert banner */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs shadow-sm"
        style={{
          background: '#fff1f2',
          border: '1px solid #fecaca',
        }}
      >
        <span
          className="px-2 py-0.5 rounded-full text-xs font-bold flex-shrink-0"
          style={{ background: '#dc2626', color: '#fff' }}
        >
          ! ALERTE
        </span>
        <span className="text-red-700">
          Master Color est sous surveillance aujourd&apos;hui. Ajoutez les DSM puis les POS pour détailler les alertes terrain.
        </span>
        {!profile.readOnly && (
          <button className="ml-auto text-red-500 hover:text-red-700 flex-shrink-0 text-xs font-semibold underline underline-offset-2">
            Voir détails →
          </button>
        )}
      </div>

      {/* KPI Row */}
      <KPICards />

      {/* Middle: gauges + chart */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1.6fr', minHeight: 280 }}>
        <GaugeSection />
        <SalesChart />
      </div>

      {/* Tracking table */}
      <TrackingTable profile={profile} onNewEntry={onNewEntry} />
    </div>
  )
}
