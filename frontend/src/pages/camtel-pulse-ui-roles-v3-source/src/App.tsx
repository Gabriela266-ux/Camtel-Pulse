import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './components/Dashboard'
import EntryModal from './components/EntryModal'
import {
  DEFAULT_BREADCRUMBS,
  DEFAULT_SELECTED_ID,
  ROLE_PROFILES,
  getVisibleTree,
  type BreadcrumbNode,
  type Role,
} from './auth/roleConfig'

export default function App() {
  const [role, setRole] = useState<Role>('Administrateur')
  const [selectedId, setSelectedId] = useState(DEFAULT_SELECTED_ID[role])
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbNode[]>(DEFAULT_BREADCRUMBS[role])
  const [date, setDate] = useState('2026-08-11')
  const [modalOpen, setModalOpen] = useState(false)
  const profile = ROLE_PROFILES[role]
  const visibleTree = getVisibleTree(role)

  const handleSelect = (id: string, _label: string, path: BreadcrumbNode[]) => {
    setSelectedId(id)
    setBreadcrumb(path)
  }

  const handleBreadcrumbClick = (id: string, _label: string, path: BreadcrumbNode[]) => {
    setSelectedId(id)
    setBreadcrumb(path)
  }

  const handleRoleChange = (nextRole: Role) => {
    setRole(nextRole)
    setSelectedId(DEFAULT_SELECTED_ID[nextRole])
    setBreadcrumb(DEFAULT_BREADCRUMBS[nextRole])
    setModalOpen(false)
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <Sidebar
        selectedId={selectedId}
        onSelect={handleSelect}
        role={role}
        onRoleChange={handleRoleChange}
        visibleTree={visibleTree}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          breadcrumb={breadcrumb}
          onBreadcrumbClick={handleBreadcrumbClick}
          profile={profile}
          date={date}
          onDateChange={setDate}
        />
        <Dashboard profile={profile} onNewEntry={() => profile.canCreateEntry && setModalOpen(true)} />
      </div>

      {modalOpen && profile.canCreateEntry && (
        <EntryModal
          onClose={() => setModalOpen(false)}
          defaultDate={date}
          role={role}
        />
      )}
    </div>
  )
}
