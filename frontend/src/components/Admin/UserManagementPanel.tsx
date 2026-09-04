import React, { useEffect, useMemo, useState } from 'react';
import { KeyRound, Mail, Plus, RefreshCw, Send, Trash2, UserPlus, X } from 'lucide-react';
import { apiService, type AdminAccountPayload, type PublicChefOperationnel, type RequestRole } from '../../api/services';
import { useAuth } from '../../auth/useAuth';
import { TemporaryPasswordModal, type TemporaryCredentials } from './TemporaryPasswordModal';

interface AccessRequestReference {
  id: string;
  statut: string;
  created_at?: string;
}

interface AdminUser {
  id: string;
  nom_complet: string;
  email: string;
  statut: string;
  matricule?: string;
  telephone?: string;
  role?: { id?: string; libelle?: string };
  chefOperationnel?: { id: string; nom_complet: string; matricule: string } | null;
  demandesAcces?: AccessRequestReference[];
}

type Feedback = { type: 'success' | 'error'; message: string } | null;

const emptyForm: AdminAccountPayload = {
  nom_complet: '',
  email: '',
  matricule: '',
  telephone: '',
  role_id: '',
};

const normalizeRole = (value?: string) =>
  String(value || '').toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const UserManagementPanel: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<RequestRole[]>([]);
  const [chefs, setChefs] = useState<PublicChefOperationnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<AdminAccountPayload>(emptyForm);
  const [creating, setCreating] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [messageUserId, setMessageUserId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<TemporaryCredentials | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await apiService.getAccounts();
      setUsers(Array.isArray(allUsers) ? allUsers : []);
      setFeedback(null);
    } catch (error) {
      setUsers([]);
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Impossible de charger les comptes enregistrés.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
    apiService.getRequestRoles()
      .then((data) => setRoles(Array.isArray(data) ? data : []))
      .catch((error) => setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Impossible de charger les rôles.' }));
    if (currentUser?.centerId) {
      apiService.getPublicChefs(currentUser.centerId)
        .then((data) => setChefs(Array.isArray(data) ? data : []))
        .catch((error) => setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Impossible de charger les Chefs opérationnels.' }));
    }
  }, [currentUser?.centerId]);

  const selectedCreateRole = roles.find((role) => role.id === createForm.role_id);
  const createsOperationnel = normalizeRole(selectedCreateRole?.libelle) === 'operationnel';

  const summary = useMemo(() => ({
    total: users.length,
    active: users.filter((account) => account.statut === 'actif').length,
    admins: users.filter((account) => ['admin', 'administrateur'].includes(normalizeRole(account.role?.libelle)) && account.statut === 'actif').length,
  }), [users]);

  const updateCreateField = (field: keyof AdminAccountPayload, value: string) => {
    setCreateForm((current) => ({ ...current, [field]: value }));
  };

  const createAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setFeedback(null);
    try {
      const result = await apiService.createAdminAccount(createForm);
      if (result.temporaryPassword) {
        setCredentials({
          name: result.nom_complet || createForm.nom_complet,
          email: result.email || createForm.email,
          matricule: result.matricule || createForm.matricule,
          password: result.temporaryPassword,
        });
      }
      setCreateForm(emptyForm);
      setCreateOpen(false);
      await loadUsers();
      setFeedback({ type: 'success', message: 'Le compte a été créé dans la base de données.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Création du compte impossible.' });
    } finally {
      setCreating(false);
    }
  };

  const transferToChef = async (account: AdminUser, chefId: string) => {
    setFeedback(null);
    try {
      await apiService.transferOperationnelToChef(account.id, chefId);
      await loadUsers();
      const chef = chefs.find((item) => item.id === chefId);
      setFeedback({ type: 'success', message: `${account.nom_complet} est maintenant rattaché à ${chef?.nom_complet || 'ce Chef'}. Le transfert a été archivé.` });
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Transfert impossible.' });
    }
  };

  const deleteAccount = async () => {
    if (!deleteCandidate) return;
    setDeleting(true);
    setFeedback(null);
    try {
      await apiService.deleteAdminAccount(deleteCandidate.id);
      setUsers((current) => current.filter((account) => account.id !== deleteCandidate.id));
      setFeedback({ type: 'success', message: `Le compte de ${deleteCandidate.nom_complet} a été supprimé.` });
      setDeleteCandidate(null);
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Suppression impossible.' });
    } finally {
      setDeleting(false);
    }
  };

  const resetPassword = async (account: AdminUser) => {
    setResettingId(account.id);
    setFeedback(null);
    try {
      const result = await apiService.resetAdminPassword(account.id);
      if (!result.temporaryPassword) throw new Error('Le serveur n’a pas renvoyé le mot de passe temporaire.');
      setCredentials({
        name: result.nom_complet || account.nom_complet,
        email: result.email || account.email,
        matricule: result.matricule || account.matricule,
        password: result.temporaryPassword,
      });
      setUsers((current) => current.map((item) => item.id === account.id ? { ...item, statut: 'actif' } : item));
      setFeedback({
        type: 'success',
        message: result.emailNotification?.sent
          ? `Mot de passe réinitialisé et envoyé à ${account.email}.`
          : 'Mot de passe réinitialisé. Remettez-le manuellement à l’utilisateur : l’envoi email a échoué.',
      });
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Réinitialisation impossible.' });
    } finally {
      setResettingId(null);
    }
  };

  const openMessage = (account: AdminUser) => {
    setMessageUserId(account.id);
    setMessageText('');
    setFeedback(null);
  };

  const sendMessage = async (account: AdminUser) => {
    const text = messageText.trim();
    if (!text) return;
    setMessageSending(true);
    setFeedback(null);
    try {
      const result = await apiService.sendMessage(account.id, text);
      setFeedback({
        type: result.sent ? 'success' : 'error',
        message: result.sent
          ? `Message envoyé à ${account.email}.`
          : 'Message enregistré, mais l’envoi email est indisponible sans configuration SMTP.',
      });
      setMessageUserId(null);
      setMessageText('');
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'Envoi impossible.' });
    } finally {
      setMessageSending(false);
    }
  };

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-sky-600 dark:text-sky-400">Comptes en base</p>
          <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">Gestion des utilisateurs</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Créez, consultez et supprimez les comptes réels de la plateforme.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={loadUsers} disabled={loading} className="ui-button-secondary cursor-pointer" title="Recharger les comptes depuis la base">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
          </button>
          <button type="button" onClick={() => setCreateOpen((open) => !open)} className="ui-button-primary cursor-pointer">
            {createOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {createOpen ? 'Fermer' : 'Créer un compte'}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Comptes enregistrés" value={summary.total} />
        <SummaryCard label="Comptes actifs" value={summary.active} />
        <SummaryCard label="Administrateurs actifs" value={summary.admins} />
      </div>

      {feedback && (
        <p role="status" className={`rounded-xl border px-4 py-3 text-sm font-semibold ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300' : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300'}`}>
          {feedback.message}
        </p>
      )}

      {createOpen && (
        <form onSubmit={createAccount} className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 dark:border-sky-900 dark:bg-sky-950/30">
          <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300"><UserPlus className="h-5 w-5" /><h3 className="text-sm font-black">Nouveau compte utilisateur</h3></div>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Un mot de passe temporaire sera généré et affiché après la création.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AdminField label="Nom complet" required value={createForm.nom_complet} onChange={(value) => updateCreateField('nom_complet', value)} />
            <AdminField label="Email" type="email" required value={createForm.email} onChange={(value) => updateCreateField('email', value)} />
            <AdminField label="Matricule" required value={createForm.matricule} onChange={(value) => updateCreateField('matricule', value)} />
            <AdminField label="Téléphone" type="tel" value={createForm.telephone || ''} onChange={(value) => updateCreateField('telephone', value)} />
            <label className="ui-label">Rôle
              <select required value={createForm.role_id} onChange={(event) => setCreateForm((current) => ({ ...current, role_id: event.target.value, chef_operationnel_id: '' }))} className="ui-field mt-1.5">
                <option value="" disabled>Sélectionnez un rôle…</option>
                {roles.map((role) => <option key={role.id} value={role.id}>{role.libelle}</option>)}
              </select>
            </label>
            {createsOperationnel && <label className="ui-label">Chef opérationnel
              <select required value={createForm.chef_operationnel_id || ''} onChange={(event) => updateCreateField('chef_operationnel_id', event.target.value)} className="ui-field mt-1.5">
                <option value="" disabled>Sélectionnez le Chef responsable…</option>
                {chefs.map((chef) => <option key={chef.id} value={chef.id}>{chef.nom_complet} — {chef.matricule}</option>)}
              </select>
              {chefs.length === 0 && <span className="mt-1 block text-xs font-medium text-amber-600">Aucun Chef actif dans ce centre.</span>}
            </label>}
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={creating || roles.length === 0} className="ui-button-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50">
              <UserPlus className="h-4 w-4" /> {creating ? 'Création…' : 'Créer le compte'}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full min-w-[1050px] border-collapse">
          <thead><tr className="bg-slate-50 text-left text-[11px] font-black uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300"><th className="p-3">Utilisateur</th><th className="p-3">Matricule</th><th className="p-3">Rôle</th><th className="p-3">Chef responsable</th><th className="p-3">Origine</th><th className="p-3">Statut</th><th className="p-3">Actions</th></tr></thead>
          <tbody>
            {users.map((account) => {
              const hasRequest = Boolean(account.demandesAcces?.length);
              const isSelf = account.id === currentUser?.id;
              const isMessaging = messageUserId === account.id;
              return (
                <React.Fragment key={account.id}>
                  <tr className="border-t border-slate-200 bg-white text-sm dark:border-slate-700 dark:bg-slate-900">
                    <td className="p-3"><p className="font-bold text-slate-900 dark:text-white">{account.nom_complet}</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{account.email}</p></td>
                    <td className="p-3 font-mono text-xs text-slate-600 dark:text-slate-300">{account.matricule || '—'}</td>
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-200">{account.role?.libelle || '—'}</td>
                    <td className="p-3">{normalizeRole(account.role?.libelle) === 'operationnel' ? <select aria-label={`Chef responsable de ${account.nom_complet}`} value={account.chefOperationnel?.id || ''} onChange={(event) => void transferToChef(account, event.target.value)} className="ui-field min-w-48 py-1.5 text-xs"><option value="" disabled>Non rattaché</option>{chefs.map((chef) => <option key={chef.id} value={chef.id}>{chef.nom_complet}</option>)}</select> : <span className="text-xs text-slate-400">—</span>}</td>
                    <td className="p-3"><span className="ui-badge">{hasRequest ? 'Demande d’accès' : 'Création Admin'}</span></td>
                    <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${account.statut === 'actif' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{account.statut === 'reset_demande' ? 'Réinitialisation demandée' : account.statut}</span></td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {account.statut === 'reset_demande' && (
                          <button type="button" onClick={() => resetPassword(account)} disabled={resettingId === account.id} className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-amber-50 px-2 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70" title="Générer et transmettre un nouveau mot de passe temporaire"><KeyRound className="h-4 w-4" /> {resettingId === account.id ? 'Réinitialisation…' : 'Réinitialiser'}</button>
                        )}
                        <button type="button" onClick={() => isMessaging ? setMessageUserId(null) : openMessage(account)} className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-sky-600 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-sky-950/40"><Mail className="h-4 w-4" /> Message</button>
                        <button type="button" onClick={() => setDeleteCandidate(account)} disabled={isSelf} className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-rose-300 dark:hover:bg-rose-950/40" title={isSelf ? 'Vous ne pouvez pas supprimer votre propre compte' : 'Supprimer ce compte'}><Trash2 className="h-4 w-4" /> Supprimer</button>
                      </div>
                    </td>
                  </tr>
                  {isMessaging && (
                    <tr className="border-t border-sky-100 bg-sky-50/60 dark:border-sky-900 dark:bg-sky-950/30"><td colSpan={7} className="p-4">
                      <label className="ui-label">Message à {account.nom_complet}
                        <textarea value={messageText} onChange={(event) => setMessageText(event.target.value)} rows={3} className="ui-field mt-1.5" placeholder="Écrivez votre message…" />
                      </label>
                      <div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => { setMessageUserId(null); setMessageText(''); }} className="ui-button-secondary cursor-pointer">Annuler</button><button type="button" onClick={() => sendMessage(account)} disabled={messageSending || !messageText.trim()} className="ui-button-primary cursor-pointer disabled:opacity-50"><Send className="h-4 w-4" /> {messageSending ? 'Envoi…' : 'Envoyer'}</button></div>
                    </td></tr>
                  )}
                </React.Fragment>
              );
            })}
            {!loading && users.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center"><UserPlus className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Aucun compte n’a été renvoyé par la base.</p><p className="mt-1 text-xs text-slate-500">Vérifiez la connexion au backend ou créez le premier compte.</p></td></tr>}
            {loading && <tr><td colSpan={7} className="px-5 py-10 text-center text-sm font-semibold text-slate-500">Chargement des comptes enregistrés…</td></tr>}
          </tbody>
        </table>
      </div>

      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"><Trash2 className="h-5 w-5" /></div>
            <h3 id="delete-account-title" className="mt-4 text-lg font-black text-slate-900 dark:text-white">Supprimer ce compte ?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Le compte de <strong>{deleteCandidate.nom_complet}</strong> sera supprimé. Son historique de demande restera archivé.</p>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setDeleteCandidate(null)} disabled={deleting} className="ui-button-secondary cursor-pointer">Annuler</button><button type="button" onClick={deleteAccount} disabled={deleting} className="ui-button-danger cursor-pointer disabled:opacity-50"><Trash2 className="h-4 w-4" /> {deleting ? 'Suppression…' : 'Supprimer définitivement'}</button></div>
          </div>
        </div>
      )}

      {credentials && <TemporaryPasswordModal credentials={credentials} onClose={() => setCredentials(null)} />}
    </section>
  );
};

const SummaryCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="panel-soft px-4 py-3"><p className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p><p className="mt-1 font-mono text-2xl font-black text-slate-900 dark:text-white">{value}</p></div>
);

const AdminField: React.FC<{ label: string; value: string; onChange: (value: string) => void; type?: React.HTMLInputTypeAttribute; required?: boolean }> = ({ label, value, onChange, type = 'text', required = false }) => (
  <label className="ui-label">{label}<input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="ui-field mt-1.5" /></label>
);

export default UserManagementPanel;
