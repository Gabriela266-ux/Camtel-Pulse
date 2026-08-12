import { useState } from 'react'
import { type TreeNode, type NodeType, type StatusType } from '../data/mockData'
import { ROLE_PROFILES, ROLES, type Role } from '../auth/roleConfig'

interface SidebarProps {
  selectedId: string
  onSelect: (id: string, label: string, path: { id: string; label: string; type: NodeType }[]) => void
  role: Role
  onRoleChange: (role: Role) => void
  visibleTree: TreeNode
}

function StatusDot({ status }: { status: StatusType }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
      style={{ background: status === 'NORMAL' ? '#16a34a' : '#dc2626' }}
    />
  )
}

const TYPE_ICONS: Record<NodeType, string> = {
  centre: '⊞',
  client: '◈',
  dsm: '◉',
  pos: '●',
}

const TYPE_INDENT: Record<NodeType, number> = {
  centre: 0,
  client: 12,
  dsm: 24,
  pos: 36,
}

function nodeOrChildMatches(node: TreeNode, query: string): boolean {
  const normalized = query.toLowerCase()
  return (
    node.label.toLowerCase().includes(normalized) ||
    (node.children ?? []).some((child) => nodeOrChildMatches(child, query))
  )
}

function TreeItem({
  node,
  selectedId,
  onSelect,
  path,
  searchQ,
  collapsed,
  role,
}: {
  node: TreeNode
  selectedId: string
  onSelect: (id: string, label: string, path: { id: string; label: string; type: NodeType }[]) => void
  path: { id: string; label: string; type: NodeType }[]
  searchQ: string
  collapsed: boolean
  role: Role
}) {
  const [open, setOpen] = useState(node.type !== 'pos')
  const hasChildren = node.children && node.children.length > 0
  const canAddDsm = role === 'Chef opérationnel' && node.type === 'client'
  const canAddPos = role === 'Chef opérationnel' && node.type === 'dsm'
  const currentPath = [...path, { id: node.id, label: node.label, type: node.type }]
  const isSelected = selectedId === node.id
  const indent = collapsed ? 0 : TYPE_INDENT[node.type]

  const matchesSearch = searchQ === '' || node.label.toLowerCase().includes(searchQ.toLowerCase())
  const childrenMatch =
    searchQ !== '' &&
    (node.children ?? []).some((c) => nodeOrChildMatches(c, searchQ))
  const forceOpen = searchQ !== '' && (matchesSearch || childrenMatch)

  if (searchQ !== '' && !matchesSearch && !childrenMatch) return null

  return (
    <div>
      <div
        title={collapsed ? node.label : undefined}
        className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer select-none transition-all duration-100 group"
        style={{
          paddingLeft: collapsed ? 8 : `${8 + indent}px`,
          background: isSelected ? '#e0f0fb' : 'transparent',
          borderLeft: isSelected ? '2px solid #0284c7' : '2px solid transparent',
          justifyContent: collapsed ? 'center' : undefined,
        }}
        onClick={() => {
          onSelect(node.id, node.label, currentPath)
          if ((hasChildren || canAddDsm || canAddPos) && !collapsed) setOpen((o) => !o)
        }}
      >
        {!collapsed && (
          hasChildren || canAddDsm || canAddPos ? (
            <span
              className="text-slate-400 text-xs w-3 flex-shrink-0 transition-transform duration-150"
              style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              ▶
            </span>
          ) : (
            <span className="w-3 flex-shrink-0" />
          )
        )}
        <span
          className="text-xs flex-shrink-0"
          style={{ color: isSelected ? '#0284c7' : '#94a3b8' }}
        >
          {TYPE_ICONS[node.type]}
        </span>
        {!collapsed && (
          <span
            className="text-xs flex-1 truncate overflow-hidden"
            style={{ color: isSelected ? '#0284c7' : '#334155', fontWeight: isSelected ? 600 : 400 }}
          >
            {node.label}
          </span>
        )}
        {!collapsed && <StatusDot status={node.status} />}
        {collapsed && isSelected && (
          <span
            className="absolute right-0 w-0.5 h-5 rounded-l"
            style={{ background: '#0284c7' }}
          />
        )}
      </div>
      {hasChildren && (open || forceOpen) && !collapsed && (
        <div>
          {node.children!.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              path={currentPath}
              searchQ={searchQ}
              collapsed={collapsed}
              role={role}
            />
          ))}
        </div>
      )}
      {!collapsed && canAddDsm && open && (
        <button
          type="button"
          className="mt-1 mb-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors hover:brightness-105"
          style={{
            marginLeft: 28,
            background: '#e0f2fe',
            color: '#0284c7',
            border: '1px solid #bae6fd',
          }}
        >
          + Ajouter DSM
        </button>
      )}
      {!collapsed && canAddPos && open && (
        <button
          type="button"
          className="mt-1 mb-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors hover:brightness-105"
          style={{
            marginLeft: 42,
            background: '#f0fdf4',
            color: '#15803d',
            border: '1px solid #bbf7d0',
          }}
        >
          + Ajouter POS
        </button>
      )}
    </div>
  )
}

export default function Sidebar({ selectedId, onSelect, role, onRoleChange, visibleTree }: SidebarProps) {
  const [searchQ, setSearchQ] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const profile = ROLE_PROFILES[role]

  return (
    <aside
      className="flex flex-col h-full flex-shrink-0 relative"
      style={{
        width: collapsed ? 64 : 244,
        transition: 'width 300ms cubic-bezier(0.4,0,0.2,1)',
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        overflow: 'hidden',
      }}
    >
      {/* Logo + toggle */}
      <div
        className="border-b border-slate-100 flex-shrink-0"
        style={{ padding: collapsed ? '16px 8px' : '16px' }}
      >
        <div className="flex items-center justify-between gap-2 mb-4">
          {/* Logo mark — always visible */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)' }}
          >
            <span className="text-white font-bold text-sm tracking-tight">CP</span>
          </div>

          {/* Text — hidden when collapsed */}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-slate-800 leading-none truncate">Camtel-Pulse</div>
              <div className="text-slate-400 text-xs mt-0.5 truncate">Centre 1 CDPSM</div>
            </div>
          )}

          {/* Toggle button */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Ouvrir la sidebar' : 'Réduire la sidebar'}
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-200"
            style={{ color: '#94a3b8' }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 300ms cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              <path
                d="M9 11L5 7L9 3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Camtel stripe — only when expanded */}
        {!collapsed && (
          <div className="flex gap-1 mb-4">
            <div className="h-0.5 flex-1 rounded-full" style={{ background: '#0284c7' }} />
            <div className="h-0.5 flex-1 rounded-full border" style={{ background: '#fff', borderColor: '#e2e8f0' }} />
            <div className="h-0.5 flex-1 rounded-full" style={{ background: '#0284c7' }} />
          </div>
        )}

        {/* Role selector — only when expanded */}
        {!collapsed && (
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Rôle actif</label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => onRoleChange(e.target.value as Role)}
                className="w-full text-xs py-1.5 px-2.5 pr-7 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-200"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <span className="absolute right-2 bottom-2 text-slate-400 text-xs pointer-events-none">▾</span>
            </div>
            <div
              className="mt-2 text-xs leading-snug px-2.5 py-2 rounded-lg"
              style={{ background: profile.surface, color: profile.tone, border: `1px solid ${profile.tone}22` }}
            >
              {profile.scopeLabel}
            </div>
          </div>
        )}
      </div>

      {/* Search — only when expanded */}
      {!collapsed && (
        <div className="px-3 py-2.5 border-b border-slate-100 flex-shrink-0">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">⌕</span>
            <input
              type="text"
              placeholder="Client, DSM, POS…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="w-full text-xs py-1.5 pl-7 pr-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-200"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }}
            />
            {searchQ && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
                onClick={() => setSearchQ('')}
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* Network label — only when expanded */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1 flex-shrink-0">
          <span className="text-slate-400 text-xs uppercase tracking-widest font-semibold">Réseau</span>
        </div>
      )}

      {/* Divider icon when collapsed */}
      {collapsed && (
        <div className="flex justify-center py-3 flex-shrink-0">
          <div className="w-6 h-px bg-slate-200" />
        </div>
      )}

      {/* Tree */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll pb-4" style={{ padding: collapsed ? '0 4px' : '0 6px' }}>
        <TreeItem
          node={visibleTree}
          selectedId={selectedId}
          onSelect={onSelect}
          path={[]}
          searchQ={collapsed ? '' : searchQ}
          collapsed={collapsed}
          role={role}
        />
      </nav>

      {/* Footer */}
      <div
        className="border-t border-slate-100 flex-shrink-0"
        style={{ padding: collapsed ? '10px 8px' : '10px 16px' }}
      >
        {collapsed ? (
          <div className="flex justify-center">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" title="Connecté" />
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>v2.4.1</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Connecté
            </span>
          </div>
        )}
      </div>
    </aside>
  )
}
