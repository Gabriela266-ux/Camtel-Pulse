import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronUp, RefreshCw, X } from 'lucide-react';
import { apiService } from '../../api/services';
import { TemporaryPasswordModal, type TemporaryCredentials } from '../Admin/TemporaryPasswordModal';

interface AccessRequest {
  id: string;
  utilisateur_id: string;
  nom_complet: string;
  email: string;
  telephone?: string;
  matricule?: string;
  statut: string;
  motif_refus?: string;
  poste?: { libelle?: string; role?: { libelle?: string } };
  role?: { libelle?: string };
}

export const AccessRequestsPanel: React.FC = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [motif, setMotif] = useState('');
  const [filter, setFilter] = useState<'EN_ATTENTE' | 'APPROUVEE' | 'REFUSEE' | 'TOUTES'>('EN_ATTENTE');
  const [credentials, setCredentials] = useState<TemporaryCredentials | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      setRequests(await apiService.getDemandes());
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Impossible de charger les demandes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const approve = async (request: AccessRequest) => {
    setProcessing(request.id);
    setMessage('');
    try {
      const result = await apiService.approveAccount(request.id);
      if (result.temporaryPassword) setCredentials({ name: result.nom_complet || request.nom_complet, email: result.email || request.email, password: result.temporaryPassword });
      await loadRequests();
      setMessage(result?.message || 'Demande validée. Le compte peut maintenant se connecter.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Validation impossible');
    } finally {
      setProcessing(null);
    }
  };

  const startReject = (request: AccessRequest) => {
    setRejecting(request.id);
    setMotif('');
  };

  const confirmReject = async (request: AccessRequest) => {
    if (!motif.trim()) {
      setMessage('Le motif de refus est obligatoire.');
      return;
    }
    setProcessing(request.id);
    setMessage('');
    try {
      const result = await apiService.rejectAccount(request.id, motif.trim());
      await loadRequests();
      setMessage(result?.message || 'Demande refusée.');
      setRejecting(null);
      setMotif('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Refus impossible');
    } finally {
      setProcessing(null);
    }
  };

  const cancelReject = () => {
    setRejecting(null);
    setMotif('');
  };

  const statusBadge = (statut: string) => {
    const styles: Record<string, string> = {
      EN_ATTENTE: 'bg-amber-100 text-amber-700',
      APPROUVEE: 'bg-emerald-100 text-emerald-700',
      REFUSEE: 'bg-rose-100 text-rose-700',
    };
    return <span className={`rounded-full px-2 py-0.5 font-bold ${styles[statut] || 'bg-slate-100 text-slate-600'}`}>{statut}</span>;
  };

  const visibleRequests = requests.filter((request) => filter === 'TOUTES' || request.statut === filter);
  const counts = {
    EN_ATTENTE: requests.filter((r) => r.statut === 'EN_ATTENTE').length,
    APPROUVEE: requests.filter((r) => r.statut === 'APPROUVEE').length,
    REFUSEE: requests.filter((r) => r.statut === 'REFUSEE').length,
    TOUTES: requests.length,
  };

  return (
    <section className="rounded-2xl border border-sky-200 border-l-4 border-l-sky-600 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-wide text-sky-700">Validation</p><h2 className="mt-1 text-xl font-black text-slate-900">Demandes d’accès</h2></div>
        <button type="button" onClick={loadRequests} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50" title="Actualiser les demandes"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser</button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(['EN_ATTENTE', 'APPROUVEE', 'REFUSEE', 'TOUTES'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${filter === key ? 'bg-sky-600 text-white' : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
          >
            {key === 'EN_ATTENTE' ? 'En attente' : key === 'APPROUVEE' ? 'Validées' : key === 'REFUSEE' ? 'Refusées' : 'Toutes'} ({counts[key]})
          </button>
        ))}
      </div>
      {message && <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700">{message}</p>}
      {loading ? <p className="mt-5 text-sm text-slate-500">Chargement des demandes...</p> : visibleRequests.length === 0 ? <p className="mt-5 text-sm text-slate-500">Aucune demande dans cette catégorie.</p> : (
        <div className="mt-5 space-y-3">
          {visibleRequests.map((request) => (
            <article key={request.id} className={`rounded-xl border p-4 ${request.statut === 'EN_ATTENTE' ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white opacity-90'}`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-sm font-black text-slate-900">{request.nom_complet} {statusBadge(request.statut)}</p>
                  <p className="mt-1 truncate text-xs text-slate-600">{request.email} · {request.telephone || 'Téléphone non fourni'}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-700">Poste : {request.poste?.libelle || '—'}</span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">Rôle auto : {request.role?.libelle || request.poste?.role?.libelle || '—'}</span>
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">{request.matricule || 'Matricule ?'}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button type="button" onClick={() => setExpanded((current) => (current === request.id ? null : request.id))} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">{expanded === request.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} Détails</button>
                  {request.statut === 'EN_ATTENTE' && (<>
                    <button type="button" onClick={() => approve(request)} disabled={processing === request.id} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"><Check className="h-4 w-4" /> Valider</button>
                    <button type="button" onClick={() => startReject(request)} disabled={processing === request.id} className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"><X className="h-4 w-4" /> Refuser</button>
                  </>)}
                </div>
              </div>


              {expanded === request.id && (
                <div className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 text-xs sm:grid-cols-2">
                  <p><span className="font-bold text-slate-500">Nom complet :</span> <span className="text-slate-800">{request.nom_complet}</span></p>
                  <p><span className="font-bold text-slate-500">Matricule :</span> <span className="text-slate-800">{request.matricule || '—'}</span></p>
                  <p><span className="font-bold text-slate-500">Email :</span> <span className="text-slate-800">{request.email}</span></p>
                  <p><span className="font-bold text-slate-500">Téléphone :</span> <span className="text-slate-800">{request.telephone || '—'}</span></p>
                  <p><span className="font-bold text-slate-500">Poste choisi :</span> <span className="text-slate-800">{request.poste?.libelle || '—'}</span></p>
                  <p><span className="font-bold text-slate-500">Rôle automatiquement déterminé :</span> <span className="text-slate-800">{request.role?.libelle || request.poste?.role?.libelle || '—'}</span></p>
                  <p className="sm:col-span-2"><span className="font-bold text-slate-500">Statut :</span> {statusBadge(request.statut)}</p>
                  {request.statut === 'REFUSEE' && request.motif_refus && <p className="sm:col-span-2"><span className="font-bold text-slate-500">Motif du refus :</span> <span className="text-rose-700">{request.motif_refus}</span></p>}
                </div>
              )}

              {rejecting === request.id && (
                <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4">
                  <label className="text-xs font-bold text-rose-700">Motif du refus (obligatoire)<textarea autoFocus value={motif} onChange={(event) => setMotif(event.target.value)} rows={3} placeholder="Indiquez la raison du refus…" className="mt-1.5 w-full rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-500" /></label>
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" onClick={() => confirmReject(request)} disabled={processing === request.id} className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"><X className="h-4 w-4" /> Confirmer le refus</button>
                    <button type="button" onClick={cancelReject} disabled={processing === request.id} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">Annuler</button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      {credentials && <TemporaryPasswordModal credentials={credentials} onClose={() => setCredentials(null)} />}
    </section>
  );
};
