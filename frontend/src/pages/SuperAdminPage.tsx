import React, { useCallback, useDeferredValue, useEffect, useRef, useState } from 'react';
import {
  Activity,
  Building2,
  CircleAlert,
  ClipboardCheck,
  Eye,
  KeyRound,
  Menu,
  Moon,
  Pencil,
  Plus,
  Power,
  Search,
  ShieldCheck,
  SunMedium,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { apiService, type AdminRecord, type CentreRecord, type SuperAdminOverview } from '../api/services';
import { useAuth } from '../auth/useAuth';
import { PlatformLogo } from '../components/common/PlatformLogo';
import { AccessRequestsPanel } from '../components/dashboard/AccessRequestsPanel';
import { AuditLogsPanel } from '../components/Admin/AuditLogsPanel';
import { TemporaryPasswordModal, type TemporaryCredentials } from '../components/Admin/TemporaryPasswordModal';

interface SuperAdminPageProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

type Section = 'overview' | 'centres' | 'admins' | 'requests' | 'audit';
type Toast = { tone: 'success' | 'error'; message: string } | null;

const navigation: Array<{ id: Section; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: 'Vue d’ensemble', icon: Activity },
  { id: 'centres', label: 'Centres', icon: Building2 },
  { id: 'admins', label: 'Administrateurs', icon: ShieldCheck },
  { id: 'requests', label: 'Demandes d’accès', icon: ClipboardCheck },
  { id: 'audit', label: 'Journal d’audit', icon: Users },
];

const emptyOverview: SuperAdminOverview = {
  activeCentres: 0,
  admins: 0,
  users: 0,
  pendingRequests: 0,
  suspendedAccounts: 0,
};

function AccessibleModal({ title, description, onClose, children }: {
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="super-modal-title" aria-describedby="super-modal-description" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div><h2 id="super-modal-title" className="text-xl font-black text-slate-950 dark:text-white">{title}</h2><p id="super-modal-description" className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p></div>
        <button ref={closeRef} type="button" onClick={onClose} className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:hover:bg-slate-800" aria-label="Fermer"><X className="h-5 w-5" /></button>
      </div>
      {children}
    </section>
  </div>;
}

function StatusPill({ active, label }: { active: boolean; label?: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black ${active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'}`}>{label || (active ? 'Actif' : 'Désactivé')}</span>;
}

function LoadingBlock({ label }: { label: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">{label}</div>;
}

export const SuperAdminPage: React.FC<SuperAdminPageProps> = ({ isDark, onToggleTheme }) => {
  const { user, logout } = useAuth();
  const [section, setSection] = useState<Section>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [overview, setOverview] = useState(emptyOverview);
  const [centres, setCentres] = useState<CentreRecord[]>([]);
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>(null);
  const [centreModal, setCentreModal] = useState<CentreRecord | 'create' | null>(null);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [credentials, setCredentials] = useState<TemporaryCredentials | null>(null);
  const [detailCentre, setDetailCentre] = useState<CentreRecord | null>(null);
  const [detailAdmin, setDetailAdmin] = useState<AdminRecord | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewData, centreData, adminData] = await Promise.all([
        apiService.getSuperAdminOverview(),
        apiService.getSuperAdminCentres(),
        apiService.getSuperAdminAdmins(),
      ]);
      setOverview(overviewData);
      setCentres(centreData);
      setAdmins(adminData);
    } catch (error) {
      setToast({ tone: 'error', message: error instanceof Error ? error.message : 'Chargement impossible.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const activateSection = (next: Section) => { setSection(next); setSidebarOpen(false); };

  return <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    {sidebarOpen && <button type="button" aria-label="Fermer le menu" className="fixed inset-0 z-40 cursor-default bg-slate-950/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-950 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="border-b border-slate-200 p-5 text-center dark:border-slate-800">
        <PlatformLogo size="modal" />
        <p className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">Gouvernance globale</p>
        <h1 className="mt-1 text-lg font-black">Super Administration</h1>
        <button type="button" className="absolute right-3 top-3 cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Fermer"><X className="h-4 w-4" /></button>
      </div>
      <nav aria-label="Navigation Super Admin" className="flex-1 space-y-1.5 p-3">
        {navigation.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => activateSection(id)} className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 ${section === id ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'}`}><Icon className="h-4 w-4" />{label}</button>)}
      </nav>
      <div className="border-t border-slate-200 p-4 dark:border-slate-800"><p className="truncate text-sm font-black">{user?.nom_complet}</p><p className="truncate text-xs text-slate-500">{user?.email}</p><button type="button" onClick={logout} className="mt-3 w-full cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900">Déconnexion</button></div>
    </aside>

    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-6">
        <div className="flex min-w-0 items-center gap-3"><button type="button" onClick={() => setSidebarOpen(true)} className="cursor-pointer rounded-lg border border-slate-200 p-2 dark:border-slate-700 lg:hidden" aria-label="Ouvrir le menu"><Menu className="h-5 w-5" /></button><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">Financial Pulse</p><h2 className="truncate text-lg font-black">{navigation.find((item) => item.id === section)?.label}</h2></div></div>
        <button type="button" onClick={onToggleTheme} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800" aria-label="Changer le thème">{isDark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}<span className="hidden sm:inline">{isDark ? 'Mode clair' : 'Mode sombre'}</span></button>
      </header>

      <main className="p-4 sm:p-6 lg:p-8">
        {loading && section !== 'requests' && section !== 'audit' ? <LoadingBlock label="Chargement des données réelles…" /> : <>
          {section === 'overview' && <OverviewPanel overview={overview} centres={centres} onNavigate={setSection} />}
          {section === 'centres' && <CentresPanel centres={centres} onCreate={() => setCentreModal('create')} onView={setDetailCentre} onEdit={setCentreModal} onStatus={async (centre) => { try { await apiService.setCentreStatus(centre.id, !centre.active); setToast({ tone: 'success', message: `Centre ${centre.active ? 'désactivé' : 'réactivé'} avec succès.` }); await refresh(); } catch (error) { setToast({ tone: 'error', message: error instanceof Error ? error.message : 'Action impossible.' }); } }} onDelete={async (centre) => { if (!window.confirm(`Supprimer définitivement ${centre.code_centre} et toutes ses données, archives et utilisateurs ? Cette action est irréversible.`)) return; try { await apiService.deleteCentre(centre.id); setToast({ tone: 'success', message: `${centre.code_centre} a été supprimé définitivement.` }); await refresh(); } catch (error) { setToast({ tone: 'error', message: error instanceof Error ? error.message : 'Suppression impossible.' }); } }} />}
          {section === 'admins' && <AdminsPanel admins={admins} onCreate={() => setAdminModalOpen(true)} onView={setDetailAdmin} onStatus={async (admin) => { try { await apiService.setAdminStatus(admin.id, admin.statut === 'actif' ? 'suspendu' : 'actif'); setToast({ tone: 'success', message: 'Statut de l’administrateur mis à jour.' }); await refresh(); } catch (error) { setToast({ tone: 'error', message: error instanceof Error ? error.message : 'Action impossible.' }); } }} onReset={async (admin) => { try { const result = await apiService.resetCentreAdminPassword(admin.id); if (result.temporaryPassword) setCredentials({ name: admin.nom_complet, email: admin.email, matricule: admin.matricule, password: result.temporaryPassword }); setToast({ tone: 'success', message: 'Mot de passe temporaire généré.' }); } catch (error) { setToast({ tone: 'error', message: error instanceof Error ? error.message : 'Réinitialisation impossible.' }); } }} />}
          {section === 'requests' && <AccessRequestsPanel />}
          {section === 'audit' && <AuditLogsPanel />}
        </>}
      </main>
    </div>

    {toast && <div role="status" aria-live="polite" className={`fixed bottom-5 right-5 z-[70] max-w-sm rounded-xl border px-4 py-3 text-sm font-bold shadow-xl ${toast.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200'}`}>{toast.message}</div>}
    {centreModal && <CentreFormModal centre={centreModal === 'create' ? null : centreModal} onClose={() => setCentreModal(null)} onSaved={async (message) => { setCentreModal(null); setToast({ tone: 'success', message }); await refresh(); }} />}
    {adminModalOpen && <AdminFormModal centres={centres.filter((centre) => centre.active)} onClose={() => setAdminModalOpen(false)} onCreated={async (admin, password) => { setAdminModalOpen(false); setToast({ tone: 'success', message: 'Administrateur créé et rattaché au centre.' }); setCredentials({ name: admin.nom_complet, email: admin.email, matricule: admin.matricule, password }); await refresh(); }} />}
    {credentials && <TemporaryPasswordModal credentials={credentials} onClose={() => setCredentials(null)} />}
    {detailCentre && <EntityDetailModal kind="centre" entity={detailCentre} onClose={() => setDetailCentre(null)} onDelete={async () => { if (!window.confirm(`Supprimer définitivement ${detailCentre.code_centre} et toutes ses données, archives et utilisateurs ? Cette action est irréversible.`)) return; try { await apiService.deleteCentre(detailCentre.id); setDetailCentre(null); setToast({ tone: 'success', message: `${detailCentre.code_centre} a été supprimé définitivement.` }); await refresh(); } catch (error) { setToast({ tone: 'error', message: error instanceof Error ? error.message : 'Suppression impossible.' }); } }} />}
    {detailAdmin && <EntityDetailModal kind="admin" entity={detailAdmin} onClose={() => setDetailAdmin(null)} />}
  </div>;
};

function OverviewPanel({ overview, centres, onNavigate }: { overview: SuperAdminOverview; centres: CentreRecord[]; onNavigate: (section: Section) => void }) {
  const cards = [
    { label: 'Centres actifs', value: overview.activeCentres, icon: Building2, tone: 'text-sky-600 bg-sky-50 dark:bg-sky-950/50' },
    { label: 'Administrateurs', value: overview.admins, icon: ShieldCheck, tone: 'text-violet-600 bg-violet-50 dark:bg-violet-950/50' },
    { label: 'Utilisateurs', value: overview.users, icon: Users, tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' },
    { label: 'Demandes en attente', value: overview.pendingRequests, icon: ClipboardCheck, tone: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50' },
  ];
  return <div className="space-y-6"><section><p className="text-sm text-slate-500 dark:text-slate-400">Supervision consolidée de tous les centres, sans donnée factice.</p><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon, tone }) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className={`inline-flex rounded-xl p-2.5 ${tone}`}><Icon className="h-5 w-5" /></div><p className="mt-4 text-3xl font-black">{value}</p><p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p></article>)}</div></section>
    {overview.suspendedAccounts > 0 && <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="text-sm font-black">{overview.suspendedAccounts} compte(s) nécessitent une attention</p><p className="mt-1 text-xs">Comptes suspendus, inactifs ou demandes de réinitialisation.</p></div></div>}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between"><div><h3 className="font-black">Centres récemment configurés</h3><p className="text-xs text-slate-500">Données organisationnelles réelles</p></div><button type="button" onClick={() => onNavigate('centres')} className="cursor-pointer text-xs font-black text-sky-600 hover:text-sky-700">Tout gérer</button></div><div className="mt-4 grid gap-3 md:grid-cols-2">{centres.slice(0, 4).map((centre) => <div key={centre.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><div className="flex items-center justify-between gap-2"><p className="font-black">{centre.code_centre}</p><StatusPill active={centre.active} /></div><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{centre.nom_centre} · {centre.region}</p><p className="mt-3 text-xs text-slate-500">{centre.counts.users} utilisateurs · {centre.counts.partners} partenaires</p></div>)}</div></section>
  </div>;
}

function CentresPanel({ centres, onCreate, onView, onEdit, onStatus, onDelete }: { centres: CentreRecord[]; onCreate: () => void; onView: (centre: CentreRecord) => void; onEdit: (centre: CentreRecord) => void; onStatus: (centre: CentreRecord) => void; onDelete: (centre: CentreRecord) => void }) {
  const [query, setQuery] = useState('');
  void onDelete;
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const filtered = centres.filter((centre) => [centre.code_centre, centre.nom_centre, centre.region, centre.telephone].some((value) => String(value || '').toLowerCase().includes(deferredQuery)));
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-black">Gestion des centres</h3><p className="mt-1 text-sm text-slate-500">Création, coordonnées et activation logique.</p></div><button type="button" onClick={onCreate} className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-black text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500"><Plus className="h-4 w-4" />Créer un centre</button></div><label className="relative mt-5 block max-w-xl"><span className="sr-only">Rechercher un centre</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Code, nom, région ou téléphone…" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-sky-900" /></label>
    {filtered.length === 0 ? <p className="mt-8 text-center text-sm text-slate-500">Aucun centre ne correspond à la recherche.</p> : <div className="mt-5 grid gap-4 lg:grid-cols-2">{filtered.map((centre) => <article key={centre.id} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700"><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h4 className="text-lg font-black">{centre.code_centre}</h4><StatusPill active={centre.active} /></div><p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">{centre.nom_centre}</p><p className="text-xs text-slate-500">{centre.region} · {centre.telephone || 'Téléphone non renseigné'}</p></div><div className="flex gap-1"><button type="button" onClick={() => onView(centre)} className="cursor-pointer rounded-lg p-2 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950" aria-label={`Voir ${centre.code_centre}`} title="Voir le détail"><Eye className="h-4 w-4" /></button><button type="button" onClick={() => onEdit(centre)} className="cursor-pointer rounded-lg p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950" aria-label={`Modifier ${centre.code_centre}`} title="Modifier"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => onStatus(centre)} className="cursor-pointer rounded-lg p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950" aria-label={`${centre.active ? 'Désactiver' : 'Réactiver'} ${centre.code_centre}`} title={centre.active ? 'Désactiver' : 'Réactiver'}><Power className="h-4 w-4" /></button></div></div><dl className="mt-5 grid grid-cols-4 gap-2 text-center">{Object.entries(centre.counts).map(([key, value]) => <div key={key} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-950"><dd className="text-lg font-black">{value}</dd><dt className="text-[10px] font-bold text-slate-500">{{ users: 'Util.', partners: 'Part.', dsms: 'DSM', pos: 'POS' }[key as keyof CentreRecord['counts']]}</dt></div>)}</dl></article>)}</div>}
  </section>;
}

function AdminsPanel({ admins, onCreate, onView, onStatus, onReset }: { admins: AdminRecord[]; onCreate: () => void; onView: (admin: AdminRecord) => void; onStatus: (admin: AdminRecord) => void; onReset: (admin: AdminRecord) => void }) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query.toLowerCase());
  const filtered = admins.filter((admin) => [admin.nom_complet, admin.email, admin.matricule, admin.centre?.code_centre, admin.centre?.nom_centre].some((value) => String(value || '').toLowerCase().includes(deferredQuery)));
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-black">Administrateurs de centre</h3><p className="mt-1 text-sm text-slate-500">Chaque administrateur est rattaché à un centre précis.</p></div><button type="button" onClick={onCreate} className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-black text-white hover:bg-sky-700"><Plus className="h-4 w-4" />Créer un Admin</button></div><label className="relative mt-5 block max-w-xl"><span className="sr-only">Rechercher un administrateur</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, email, matricule ou centre…" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-sky-900" /></label>
    <div className="mt-5 overflow-x-auto"><table className="min-w-[820px] w-full text-left text-sm"><thead><tr className="border-b border-slate-200 text-[11px] font-black uppercase tracking-wide text-slate-500 dark:border-slate-700"><th className="px-3 py-3">Administrateur</th><th className="px-3 py-3">Matricule</th><th className="px-3 py-3">Centre</th><th className="px-3 py-3">Statut</th><th className="px-3 py-3 text-right">Actions</th></tr></thead><tbody>{filtered.map((admin) => <tr key={admin.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800"><td className="px-3 py-3"><p className="font-black">{admin.nom_complet}</p><p className="text-xs text-slate-500">{admin.email}</p></td><td className="px-3 py-3 font-mono text-xs">{admin.matricule}</td><td className="px-3 py-3"><p className="font-bold">{admin.centre?.code_centre || '—'}</p><p className="text-xs text-slate-500">{admin.centre?.nom_centre}</p></td><td className="px-3 py-3"><StatusPill active={admin.statut === 'actif'} label={admin.statut === 'actif' ? 'Actif' : 'Suspendu'} /></td><td className="px-3 py-3"><div className="flex justify-end gap-2"><button type="button" onClick={() => onView(admin)} className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-violet-200 px-2.5 py-2 text-xs font-bold text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-950"><Eye className="h-3.5 w-3.5" />Détails</button><button type="button" onClick={() => onReset(admin)} className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-sky-200 px-2.5 py-2 text-xs font-bold text-sky-700 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-300 dark:hover:bg-sky-950"><KeyRound className="h-3.5 w-3.5" />Réinitialiser</button><button type="button" onClick={() => onStatus(admin)} className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-amber-200 px-2.5 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950"><Power className="h-3.5 w-3.5" />{admin.statut === 'actif' ? 'Suspendre' : 'Réactiver'}</button></div></td></tr>)}</tbody></table>{filtered.length === 0 && <p className="py-10 text-center text-sm text-slate-500">Aucun administrateur trouvé.</p>}</div>
  </section>;
}

function CentreFormModal({ centre, onClose, onSaved }: { centre: CentreRecord | null; onClose: () => void; onSaved: (message: string) => void }) {
  const [form, setForm] = useState({ nom_centre: centre?.nom_centre || '', region: centre?.region || '', telephone: centre?.telephone || '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { if (centre) await apiService.updateCentre(centre.id, form); else await apiService.createCentre(form); onSaved(centre ? 'Centre modifié avec succès.' : 'Centre créé avec un code CPDSM généré automatiquement.'); } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'Enregistrement impossible.'); } finally { setSaving(false); } };
  const field = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-sky-900';
  return <AccessibleModal title={centre ? `Modifier ${centre.code_centre}` : 'Créer un centre'} description="Le code CPDSM est généré par le serveur et ne peut pas être choisi manuellement." onClose={onClose}><form onSubmit={submit} className="mt-6 space-y-4">{centre && <label className="block text-xs font-bold text-slate-500">Code centre<input readOnly value={centre.code_centre} className={`${field} cursor-not-allowed bg-slate-100 font-mono dark:bg-slate-800`} /></label>}<label className="block text-xs font-bold text-slate-500">Nom du centre<input autoFocus required value={form.nom_centre} onChange={(event) => setForm((current) => ({ ...current, nom_centre: event.target.value }))} className={field} /></label><label className="block text-xs font-bold text-slate-500">Région<input required value={form.region} onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))} className={field} /></label><label className="block text-xs font-bold text-slate-500">Téléphone<input required type="tel" value={form.telephone} onChange={(event) => setForm((current) => ({ ...current, telephone: event.target.value }))} className={field} /></label>{error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">{error}</p>}<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold dark:border-slate-700">Annuler</button><button disabled={saving} className="cursor-pointer rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Enregistrement…' : 'Enregistrer'}</button></div></form></AccessibleModal>;
}

function AdminFormModal({ centres, onClose, onCreated }: { centres: CentreRecord[]; onClose: () => void; onCreated: (admin: { nom_complet: string; email: string; matricule: string }, password: string) => void }) {
  const [form, setForm] = useState({ nom_complet: '', matricule: '', email: '', telephone: '', centre_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setSaving(true); setError(''); try { const result = await apiService.createCentreAdmin(form); if (!result.temporaryPassword) throw new Error('Le serveur n’a pas retourné le mot de passe temporaire.'); onCreated({ nom_complet: result.nom_complet || form.nom_complet, email: result.email || form.email, matricule: result.matricule || form.matricule }, result.temporaryPassword); } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'Création impossible.'); } finally { setSaving(false); } };
  const field = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-sky-900';
  return <AccessibleModal title="Créer un administrateur" description="Le rôle Admin est imposé par le serveur. Le mot de passe temporaire ne sera affiché qu’une fois." onClose={onClose}><form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-slate-500">Nom complet<input autoFocus required value={form.nom_complet} onChange={(event) => update('nom_complet', event.target.value)} className={field} /></label><label className="text-xs font-bold text-slate-500">Matricule<input required value={form.matricule} onChange={(event) => update('matricule', event.target.value)} className={field} /></label><label className="text-xs font-bold text-slate-500">Email<input required type="email" value={form.email} onChange={(event) => update('email', event.target.value)} className={field} /></label><label className="text-xs font-bold text-slate-500">Téléphone<input required type="tel" value={form.telephone} onChange={(event) => update('telephone', event.target.value)} className={field} /></label><label className="text-xs font-bold text-slate-500 sm:col-span-2">Centre<select required value={form.centre_id} onChange={(event) => update('centre_id', event.target.value)} className={field}><option value="" disabled>Sélectionnez un centre actif…</option>{centres.map((centre) => <option key={centre.id} value={centre.id}>{centre.code_centre} — {centre.nom_centre} — {centre.region}</option>)}</select></label>{error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300 sm:col-span-2">{error}</p>}<div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={onClose} className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold dark:border-slate-700">Annuler</button><button disabled={saving || centres.length === 0} className="cursor-pointer rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Création…' : 'Créer l’Admin'}</button></div></form></AccessibleModal>;
}

function EntityDetailModal({ kind, entity, onClose, onDelete }: {
  kind: 'centre' | 'admin';
  entity: CentreRecord | AdminRecord;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const [history, setHistory] = useState<Array<{ id: string; date: string; type: string; auteur: string; detail?: string }>>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const isCentre = kind === 'centre';
  const centre = isCentre ? entity as CentreRecord : null;
  const admin = !isCentre ? entity as AdminRecord : null;

  useEffect(() => {
    let cancelled = false;
    apiService.getAudit()
      .then((logs) => {
        if (cancelled) return;
        const filtered = (Array.isArray(logs) ? logs : []).filter((log) => isCentre
          ? String(log.centreId || '') === String(centre?.id || '') || (log.entiteType === 'centre' && String(log.entiteId) === String(centre?.id))
          : log.entiteType === 'utilisateur' && String(log.entiteId) === String(admin?.id));
        setHistory(filtered.slice(0, 12));
      })
      .finally(() => { if (!cancelled) setLoadingHistory(false); });
    return () => { cancelled = true; };
  }, [admin?.id, centre?.id, isCentre]);

  return <AccessibleModal title={isCentre ? `${centre?.code_centre} — ${centre?.nom_centre}` : admin?.nom_complet || 'Administrateur'} description={isCentre ? 'Détail organisationnel et historique du centre.' : 'Compte administrateur, centre associé et actions récentes.'} onClose={onClose}>
    <dl className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-950 sm:grid-cols-2">
      {isCentre ? <>
        <div><dt className="text-xs font-bold text-slate-500">Région</dt><dd className="mt-1 font-black">{centre?.region}</dd></div>
        <div><dt className="text-xs font-bold text-slate-500">Téléphone</dt><dd className="mt-1 font-black">{centre?.telephone || '—'}</dd></div>
        <div><dt className="text-xs font-bold text-slate-500">Statut</dt><dd className="mt-1"><StatusPill active={Boolean(centre?.active)} /></dd></div>
        <div><dt className="text-xs font-bold text-slate-500">Périmètre</dt><dd className="mt-1 font-black">{centre?.counts.users} utilisateurs · {centre?.counts.partners} partenaires · {centre?.counts.dsms} DSM · {centre?.counts.pos} POS</dd></div>
      </> : <>
        <div><dt className="text-xs font-bold text-slate-500">Email</dt><dd className="mt-1 break-all font-black">{admin?.email}</dd></div>
        <div><dt className="text-xs font-bold text-slate-500">Matricule</dt><dd className="mt-1 font-mono font-black">{admin?.matricule}</dd></div>
        <div><dt className="text-xs font-bold text-slate-500">Téléphone</dt><dd className="mt-1 font-black">{admin?.telephone || '—'}</dd></div>
        <div><dt className="text-xs font-bold text-slate-500">Centre</dt><dd className="mt-1 font-black">{admin?.centre?.code_centre} — {admin?.centre?.nom_centre}</dd></div>
        <div><dt className="text-xs font-bold text-slate-500">Statut</dt><dd className="mt-1"><StatusPill active={admin?.statut === 'actif'} label={admin?.statut} /></dd></div>
      </>}
    </dl>
    {isCentre && onDelete && <button type="button" onClick={onDelete} className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-black text-white hover:bg-rose-700" title="Supprimer définitivement"><Trash2 className="h-4 w-4" />Supprimer définitivement</button>}
    <div className="mt-5"><h3 className="text-sm font-black">Historique récent</h3>{loadingHistory ? <p className="mt-3 text-sm text-slate-500">Chargement de l’historique…</p> : history.length === 0 ? <p className="mt-3 text-sm text-slate-500">Aucune modification enregistrée pour cette entité.</p> : <ol className="mt-3 space-y-2">{history.map((item) => <li key={item.id} className="rounded-lg border border-slate-200 p-3 text-xs dark:border-slate-700"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-black text-sky-700 dark:text-sky-300">{item.type}</span><time className="text-slate-400">{new Date(item.date).toLocaleString('fr-FR')}</time></div><p className="mt-1 text-slate-600 dark:text-slate-300">{item.detail || 'Modification enregistrée'} · {item.auteur}</p></li>)}</ol>}</div>
  </AccessibleModal>;
}

export default SuperAdminPage;
