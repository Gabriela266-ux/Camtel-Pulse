import React, { useEffect, useCallback, useState } from 'react';
import { ArrowRight, CheckCircle2, ClipboardList, LockKeyhole, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService, type PublicCentre, type PublicChefOperationnel, type RequestRole } from '../api/services';
import { PlatformLogo } from '../components/common/PlatformLogo';

interface WelcomePageProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

const initialForm = {
  name: '',
  role_id: '',
  centre_id: '',
  chef_operationnel_id: '',
  matricule: '',
  email: '',
  telephone: '',
  dateDemande: new Date().toISOString().slice(0, 10),
};

export const WelcomePage: React.FC<WelcomePageProps> = ({ isDark, onToggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [requestOpen, setRequestOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [roles, setRoles] = useState<RequestRole[]>([]);
  const [centres, setCentres] = useState<PublicCentre[]>([]);
  const [chefs, setChefs] = useState<PublicChefOperationnel[]>([]);
  const [chefsLoading, setChefsLoading] = useState(false);
  const [chefsError, setChefsError] = useState('');
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  // Les identifiants des quatre rôles sont chargés depuis la base : aucune
  // valeur technique ou option factice n'est intégrée au formulaire.
  const loadRoles = useCallback(async () => {
    setRolesLoading(true);
    setRolesError('');
    try {
      setRoles(await apiService.getRequestRoles());
    } catch (loadError) {
      setRolesError(loadError instanceof Error ? loadError.message : 'Impossible de charger les rôles');
    } finally {
      setRolesLoading(false);
    }
  }, []);

  const loadCentres = useCallback(async () => {
    try {
      setCentres(await apiService.getPublicCentres());
    } catch (loadError) {
      setRolesError(loadError instanceof Error ? loadError.message : 'Impossible de charger les centres');
    }
  }, []);

  useEffect(() => { void Promise.all([loadRoles(), loadCentres()]); }, [loadRoles, loadCentres]);

  const selectedRole = roles.find((role) => role.id === form.role_id);
  const isOperationnel = String(selectedRole?.libelle || '')
    .toLocaleLowerCase('fr')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'operationnel';

  useEffect(() => {
    if (!isOperationnel || !form.centre_id) {
      setChefs([]);
      setChefsError('');
      setForm((current) => current.chef_operationnel_id
        ? { ...current, chef_operationnel_id: '' }
        : current);
      return;
    }
    let active = true;
    setChefsLoading(true);
    setChefsError('');
    apiService.getPublicChefs(form.centre_id)
      .then((items) => { if (active) setChefs(items); })
      .catch((loadError) => {
        if (!active) return;
        setChefs([]);
        setChefsError(loadError instanceof Error ? loadError.message : 'Impossible de charger les Chefs');
      })
      .finally(() => { if (active) setChefsLoading(false); });
    return () => { active = false; };
  }, [form.centre_id, isOperationnel]);

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openRequest = useCallback(async () => {
    setRequestOpen(true);
    setStatus('idle');
    setError('');
    setForm(initialForm);
    if (roles.length === 0 && !rolesLoading) {
      await loadRoles();
    }
    if (centres.length === 0) await loadCentres();
  }, [roles.length, rolesLoading, centres.length, loadRoles, loadCentres]);

  useEffect(() => {
    if (location.state && (location.state as any).openRequest) {
      openRequest();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate, openRequest]);

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('saving');
    setError('');

    try {
      await apiService.requestAccess({
        name: form.name,
        role_id: form.role_id,
        centre_id: form.centre_id,
        chef_operationnel_id: isOperationnel ? form.chef_operationnel_id : undefined,
        matricule: form.matricule,
        email: form.email,
        telephone: form.telephone,
        dateDemande: form.dateDemande,
      });
      setStatus('success');
    } catch (requestError) {
      setStatus('error');
      setError(requestError instanceof Error ? requestError.message : 'Demande impossible');
    }
  };

  const panel = isDark ? 'bg-slate-900/90 border-slate-700 text-slate-100' : 'bg-white/90 border-slate-200 text-slate-900';
  const field = isDark ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-200 bg-white text-slate-800';


  return (
    <main className={`relative min-h-screen overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.22),transparent_36%),linear-gradient(135deg,#eaf6ff_0%,#f8fafc_48%,#dbeafe_100%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_36%),linear-gradient(135deg,#071426_0%,#020617_52%,#0c2340_100%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 sm:px-10 lg:px-16">
        <header className="relative flex justify-center pb-4">
          <PlatformLogo size="hero" />
          <button type="button" onClick={onToggleTheme} className="absolute right-0 top-0 rounded-lg border border-slate-300 bg-white/80 px-3 py-2 text-xs font-bold text-slate-600 transition-colors duration-200 hover:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Changer le thème">
            {isDark ? 'Mode clair' : 'Mode sombre'}
          </button>
        </header>

        <section className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-10">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/70 px-3 py-1.5 text-xs font-bold text-sky-700 shadow-sm dark:border-sky-900 dark:bg-slate-900/70 dark:text-sky-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Suivi financier en temps réel
            </div>
            <h1 className="text-4xl font-black leading-[1.02] tracking-tight text-slate-950 sm:text-6xl dark:text-white">Pilotez vos performances avec une vision claire</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">Prenez le pouls de votre performance financière et commerciale, du suivi quotidien jusqu’à la vision mensuelle.</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => navigate('/login')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-sky-600/25 hover:-translate-y-0.5 hover:bg-sky-700">Se connecter <ArrowRight className="h-4 w-4" /></button>
              <button type="button" onClick={openRequest} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-6 py-3.5 text-sm font-black text-slate-700 shadow-sm hover:-translate-y-0.5 hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100">Demande d’accès <ClipboardList className="h-4 w-4" /></button>
            </div>
          </div>

          <div className={`relative overflow-hidden rounded-3xl border p-7 shadow-2xl shadow-sky-900/10 backdrop-blur ${panel}`}>
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full border-[22px] border-sky-100/70 dark:border-sky-900/40" />
            <div className="relative">
              <LockKeyhole className="h-8 w-8 text-sky-600 dark:text-sky-400" />
              <h2 className="mt-7 text-2xl font-black">Une lecture claire de vos résultats</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">Objectifs, achats, stocks et alertes réunis dans un espace de pilotage pensé pour CAMTEL.</p>
              <div className="mt-9 space-y-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                {['Objectifs mensuels', 'Suivi quotidien', 'Alertes de performance'].map((item) => <div key={item} className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500" />{item}</div>)}
              </div>
            </div>
          </div>
        </section>
      </div>

      {requestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={submitRequest} className={`relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border p-6 shadow-2xl ${panel}`}>
            <div className="flex flex-col items-center text-center">
              <PlatformLogo size="modal" />
              <p className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-sky-600">Accès plateforme</p>
              <h2 className="mt-1 text-2xl font-black">Demande d’accès</h2>
              <button type="button" onClick={() => setRequestOpen(false)} className="absolute right-4 top-4 cursor-pointer rounded-lg p-2 text-slate-400 transition-colors duration-200 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:hover:bg-slate-800" aria-label="Fermer"><X className="h-5 w-5" /></button>
            </div>
            {status === 'success' ? <div className="py-12 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" /><h3 className="mt-4 text-lg font-black">Demande envoyée</h3><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Votre demande sera examinée par l’administrateur.</p><button type="button" onClick={() => navigate('/login')} className="mt-4 text-xs font-bold text-sky-600 hover:text-sky-700">J'ai déjà un compte (Se connecter)</button></div> : <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Nom complet<input required type="text" value={form.name} onChange={(event) => updateField('name', event.target.value)} className={`mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-sky-500 ${field}`} /></label>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Rôle demandé<select required value={form.role_id} onChange={(event) => updateField('role_id', event.target.value)} className={`mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900 ${field}`} disabled={rolesLoading}>{rolesLoading ? <option value="">Chargement des rôles…</option> : <><option value="" disabled>Sélectionnez votre rôle…</option>{roles.map((roleOption) => <option key={roleOption.id} value={roleOption.id}>{roleOption.libelle}</option>)}</>}</select>{rolesError && <span className="mt-1 block text-xs font-medium text-rose-600">{rolesError} — Vérifiez que le serveur est démarré.</span>}</label>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 sm:col-span-2">Centre de rattachement<select required value={form.centre_id} onChange={(event) => updateField('centre_id', event.target.value)} className={`mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900 ${field}`}><option value="" disabled>Sélectionnez votre centre…</option>{centres.map((centre) => <option key={centre.id} value={centre.id}>{centre.code_centre} — {centre.nom_centre} — {centre.region}</option>)}</select>{centres.length === 0 && !rolesLoading && <span className="mt-1 block text-xs font-medium text-amber-600">Aucun centre actif disponible.</span>}</label>
                {isOperationnel && <label className="text-xs font-bold text-slate-500 dark:text-slate-400 sm:col-span-2">Chef opérationnel souhaité<select required value={form.chef_operationnel_id} onChange={(event) => updateField('chef_operationnel_id', event.target.value)} disabled={chefsLoading || !form.centre_id} className={`mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900 ${field}`}><option value="" disabled>{chefsLoading ? 'Chargement des Chefs…' : 'Sélectionnez le Chef de votre future équipe…'}</option>{chefs.map((chef) => <option key={chef.id} value={chef.id}>{chef.nom_complet} — {chef.matricule}</option>)}</select>{chefsError && <span className="mt-1 block text-xs font-medium text-rose-600">{chefsError}</span>}{!chefsLoading && !chefsError && form.centre_id && chefs.length === 0 && <span className="mt-1 block text-xs font-medium text-amber-600">Aucun Chef opérationnel actif n’est disponible dans ce centre.</span>}<span className="mt-1 block text-[11px] font-medium text-slate-400">L’Administrateur vérifiera ce rattachement avant de valider la demande.</span></label>}
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Matricule<input required type="text" value={form.matricule} onChange={(event) => updateField('matricule', event.target.value)} className={`mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-sky-500 ${field}`} /></label>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Email<input required type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} className={`mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-sky-500 ${field}`} /></label>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Numéro de téléphone<input required type="tel" value={form.telephone} onChange={(event) => updateField('telephone', event.target.value)} className={`mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-sky-500 ${field}`} /></label>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Date de demande<input required type="date" value={form.dateDemande} onChange={(event) => updateField('dateDemande', event.target.value)} className={`mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-sky-500 ${field}`} /></label>
              </div>
              {error && <p className="mt-4 rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600">{error}</p>}
              <button type="submit" disabled={status === 'saving'} className="mt-6 w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-black text-white hover:bg-sky-700 disabled:opacity-50">{status === 'saving' ? 'Envoi en cours…' : 'Envoyer la demande'}</button>
              <button type="button" onClick={() => navigate('/login')} className="mt-3 w-full text-center text-xs font-bold text-sky-600 hover:text-sky-700">
                J'ai déjà un compte (Se connecter)
              </button>
            </>}
          </form>
        </div>
      )}
    </main>
  );
};
