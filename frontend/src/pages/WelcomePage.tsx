import React, { useEffect, useCallback, useState } from 'react';
import { ArrowRight, CheckCircle2, ClipboardList, LockKeyhole, Search, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService, type Poste } from '../api/services';

interface WelcomePageProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

const initialForm = {
  name: '',
  poste: '',
  poste_id: '',
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
  const [postes, setPostes] = useState<Poste[]>([]);
  const [postesLoading, setPostesLoading] = useState(false);
  const [postesError, setPostesError] = useState('');
  const [lookup, setLookup] = useState({ matricule: '', email: '' });
  const [lookupMsg, setLookupMsg] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  // Charge la liste des postes (avec leur rôle) dès l'affichage de la page,
  // pour que le menu déroulant soit prêt à l'ouverture de la demande d'accès.
  const loadPostes = useCallback(async () => {
    setPostesLoading(true);
    setPostesError('');
    try {
      setPostes(await apiService.getPostes());
    } catch (loadError) {
      setPostesError(loadError instanceof Error ? loadError.message : 'Impossible de charger les postes');
    } finally {
      setPostesLoading(false);
    }
  }, []);

  useEffect(() => { loadPostes(); }, [loadPostes]);

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openRequest = useCallback(async () => {
    setRequestOpen(true);
    setStatus('idle');
    setError('');
    setLookupMsg('');
    setLookup({ matricule: '', email: '' });
    setForm(initialForm);
    if (postes.length === 0 && !postesLoading) {
      await loadPostes();
    }
  }, [postes.length, postesLoading, loadPostes]);

  useEffect(() => {
    if (location.state && (location.state as any).openRequest) {
      openRequest();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate, openRequest]);

  // Récupère automatiquement depuis la base les informations déjà connues du
  // demandeur (matricule / email) puis pré-remplit le formulaire.
  const handleLookup = async () => {
    setLookupMsg('');
    try {
      const found = await apiService.lookupRequestUser(lookup);
      if (!found) {
        setLookupMsg('Aucune information trouvée pour ce matricule / email. Saisissez vos informations.');
        return;
      }
      const matched = {
        name: found.nom_complet || '',
        poste: (found.poste && found.poste.libelle) || '',
        poste_id: (found.poste && found.poste.id) || '',
        matricule: found.matricule || '',
        email: found.email || '',
        telephone: found.telephone || '',
        dateDemande: form.dateDemande,
      };
      setForm(matched);
      setLookupMsg('Informations récupérées depuis la base. Vérifiez puis sélectionnez votre poste.');
    } catch (lookupError) {
      setLookupMsg(lookupError instanceof Error ? lookupError.message : 'Récupération impossible');
    }
  };

  const handlePosteChange = (value: string) => {
    const selected = postes.find((poste) => poste.id === value);
    setForm((current) => ({
      ...current,
      poste_id: value,
      poste: selected ? selected.libelle : value,
    }));
  };

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('saving');
    setError('');

    try {
      const selected = form.poste_id
        ? postes.find((poste) => poste.id === form.poste_id)
        : postes.find((poste) => poste.libelle === form.poste);
      await apiService.requestAccess({
        name: form.name,
        poste: (selected && selected.libelle) || form.poste,
        poste_id: (selected && selected.id) || form.poste_id || undefined,
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
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-camtel.png" alt="CAMTEL" className="h-12 w-12 rounded-xl object-contain shadow-sm" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">CAMTEL</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pilotage de la performance</p>
            </div>
          </div>
          <button type="button" onClick={onToggleTheme} className="rounded-lg border border-slate-300 bg-white/70 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300" aria-label="Changer le thème">
            {isDark ? 'Mode clair' : 'Mode sombre'}
          </button>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/70 px-3 py-1.5 text-xs font-bold text-sky-700 shadow-sm dark:border-sky-900 dark:bg-slate-900/70 dark:text-sky-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Suivi financier en temps réel
            </div>
            <h1 className="text-5xl font-black leading-[0.98] tracking-tight text-slate-950 sm:text-7xl dark:text-white">BLUE<br /><span className="text-sky-600 dark:text-sky-400">FINANCIAL PULSE</span></h1>
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
          <form onSubmit={submitRequest} className={`max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border p-6 shadow-2xl ${panel}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3"><img src="/logo-camtel.png" alt="CAMTEL" className="h-12 w-12 rounded-lg object-contain" /><div><p className="text-xs font-black uppercase tracking-[0.2em] text-sky-600">Accès plateforme</p><h2 className="mt-1 text-2xl font-black">Demande d’accès</h2></div></div>
              <button type="button" onClick={() => setRequestOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Fermer"><X className="h-5 w-5" /></button>
            </div>
            {status === 'success' ? <div className="py-12 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" /><h3 className="mt-4 text-lg font-black">Demande envoyée</h3><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Votre demande sera examinée par l’administrateur.</p><button type="button" onClick={() => navigate('/login')} className="mt-4 text-xs font-bold text-sky-600 hover:text-sky-700">J'ai déjà un compte (Se connecter)</button></div> : <>
              {/* Récupération automatique des informations existantes */}
              <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900 dark:bg-sky-950/40">
                <p className="text-xs font-bold text-sky-700 dark:text-sky-300">Récupérer mes informations</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Matricule<input value={lookup.matricule} onChange={(event) => setLookup((current) => ({ ...current, matricule: event.target.value }))} placeholder="Ex : ADM-001" className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500 ${field}`} /></label>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Email<input value={lookup.email} onChange={(event) => setLookup((current) => ({ ...current, email: event.target.value }))} placeholder="Ex : nom@camtel.cm" className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-sky-500 ${field}`} /></label>
                  <button type="button" onClick={handleLookup} className="inline-flex items-center justify-center gap-1.5 self-end rounded-lg bg-sky-600 px-4 py-2.5 text-xs font-black text-white hover:bg-sky-700"><Search className="h-4 w-4" /> Chercher</button>
                </div>
                {lookupMsg && <p className="mt-2 text-xs font-medium text-sky-700 dark:text-sky-300">{lookupMsg}</p>}
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Nom complet<input required type="text" value={form.name} onChange={(event) => updateField('name', event.target.value)} className={`mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-sky-500 ${field}`} /></label>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Poste<select required value={form.poste_id} onChange={(event) => handlePosteChange(event.target.value)} className={`mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-sky-500 ${field}`} disabled={postesLoading}>{postesLoading ? <option value="">Chargement des postes…</option> : <><option value="" disabled>Sélectionnez votre poste…</option>{postes.map((poste) => <option key={poste.id} value={poste.id}>{poste.libelle}</option>)}</>}</select>{postesError && <span className="mt-1 block text-xs font-medium text-rose-600">{postesError} — Vérifiez que le serveur est démarré.</span>}</label>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Matricule<input required type="text" value={form.matricule} onChange={(event) => updateField('matricule', event.target.value)} className={`mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-sky-500 ${field}`} /></label>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Email<input required type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} className={`mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-sky-500 ${field}`} /></label>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Numéro de téléphone<input type="tel" value={form.telephone} onChange={(event) => updateField('telephone', event.target.value)} className={`mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-sky-500 ${field}`} /></label>
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

