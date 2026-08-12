import { type NodeType } from '../data/mockData'
import { type RoleProfile } from '../auth/roleConfig'

interface BreadcrumbNode {
  id: string
  label: string
  type: NodeType
}

interface TopbarProps {
  breadcrumb: BreadcrumbNode[]
  onBreadcrumbClick: (id: string, label: string, path: BreadcrumbNode[]) => void
  profile: RoleProfile
  date: string
  onDateChange: (d: string) => void
}

const TYPE_BADGE: Record<NodeType, { label: string; color: string; bg: string }> = {
  centre: { label: 'Centre', color: '#0284c7', bg: '#e0f2fe' },
  client: { label: 'Client / DA', color: '#b45309', bg: '#fef3c7' },
  dsm: { label: 'DSM', color: '#7c3aed', bg: '#ede9fe' },
  pos: { label: 'POS', color: '#15803d', bg: '#dcfce7' },
}

export default function Topbar({ breadcrumb, onBreadcrumbClick, profile, date, onDateChange }: TopbarProps) {
  const current = breadcrumb[breadcrumb.length - 1]
  const badge = current ? TYPE_BADGE[current.type] : null

  return (
    <header
      className="flex items-center justify-between px-6 py-3 gap-4 flex-shrink-0"
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        minHeight: 58,
      }}
    >
      {/* Left */}
      <div className="flex flex-col justify-center min-w-0">
        <nav className="flex items-center gap-1 text-xs mb-0.5 flex-wrap">
          {breadcrumb.map((node, i) => {
            const isLast = i === breadcrumb.length - 1
            return (
              <span key={node.id} className="flex items-center gap-1">
                {i > 0 && <span className="text-slate-300">/</span>}
                <button
                  className="transition-colors hover:text-sky-600 focus:outline-none disabled:cursor-default"
                  style={{ color: isLast ? '#0f172a' : '#94a3b8' }}
                  onClick={() => !isLast && onBreadcrumbClick(node.id, node.label, breadcrumb.slice(0, i + 1))}
                  disabled={isLast}
                >
                  {node.label}
                </button>
              </span>
            )
          })}
        </nav>
        <div className="flex items-center gap-2">
          <h1 className="text-slate-800 font-bold text-base leading-tight truncate">
            {current?.label ?? 'Vue Globale'}
          </h1>
          {badge && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
              style={{ color: badge.color, background: badge.bg }}
            >
              {badge.label}
            </span>
          )}
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
            style={{ color: profile.tone, background: profile.surface }}
          >
            {profile.label}
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs hidden sm:inline">Référence</span>
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#334155',
              colorScheme: 'light',
            }}
          />
        </div>

        <div
          className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg"
          style={{ background: profile.surface, color: profile.tone, border: `1px solid ${profile.tone}22` }}
        >
          {profile.readOnly ? 'Vue lecture seule' : profile.primaryAction}
        </div>

        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: profile.surface, color: profile.tone, border: `2px solid ${profile.tone}33` }}
        >
          {profile.initials}
        </div>
      </div>
    </header>
  )
}
