import React, { useEffect, useState } from 'react';
import { Check, Mail, RefreshCw, Send, X } from 'lucide-react';
import { apiService } from '../../api/services';
import { TemporaryPasswordModal, type TemporaryCredentials } from './TemporaryPasswordModal';

interface AdminUser {
  id: string;
  nom_complet: string;
  email: string;
  statut: string;
  matricule?: string;
  role?: { libelle?: string };
}

export const UserManagementPanel: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [pendingMap, setPendingMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  // Envoi de message : utilisateur cible + contenu en cours de saisie.
  const [messageUserId, setMessageUserId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [credentials, setCredentials] = useState<TemporaryCredentials | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [allUsers, pending] = await Promise.all([apiService.getAccounts(), apiService.getPendingAccounts()]);
      setUsers(allUsers);
      // pending = demandes d'accès : on mappe utilisateur_id -> id de demande.
      const map: Record<string, string> = {};
      pending.forEach((demande: any) => {
        if (demande.utilisateur_id) map[String(demande.utilisateur_id)] = String(demande.id);
      });
      setPendingMap(map);
      setPendingIds(new Set(Object.keys(map)));
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const decide = async (user: AdminUser, decision: 'approve' | 'reject') => {
    const demandeId = pendingMap[String(user.id)];
    if (!demandeId) return;
    try {
      if (decision === 'reject') {
        const motif = window.prompt('Motif du refus (obligatoire) :');
        if (motif === null) return;
        if (!motif.trim()) {
          setMessage('Le motif de refus est obligatoire.');
          return;
        }
        const result = await apiService.rejectAccount(demandeId, motif.trim());
        setMessage(result?.message || 'Demande refusée.');
      } else {
        const result = await apiService.approveAccount(demandeId);
        if (result.temporaryPassword) setCredentials({ name: result.nom_complet || user.nom_complet, email: result.email || user.email, password: result.temporaryPassword });
        setMessage(result?.message || 'Demande validée.');
      }
      await loadUsers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Action impossible');
    }
  };

  const openMessage = (user: AdminUser) => {
    setMessageUserId(String(user.id));
    setMessageText('');
    setMessage("");
  };

  const sendMessage = async (user: AdminUser) => {
    const text = messageText.trim();
    if (!text) {
      setMessage('Le message est obligatoire.');
      return;
    }
    setMessageSending(true);
    setMessage("");
    try {
      const result = await apiService.sendMessage(String(user.id), text);
      setMessage(result.sent
        ? `Message envoyé à ${user.email}.`
        : `Envoi email impossible pour ${user.email} (SMTP). Vérifiez la configuration.`);
      setMessageUserId(null);
      setMessageText('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Envoi impossible');
    } finally {
      setMessageSending(false);
    }
  };

  const activeAdmins = users.filter((user) => user.role?.libelle?.toLowerCase() === 'admin' && user.statut === 'actif').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-wide text-sky-600">Administration</p><h2 className="text-lg font-bold">Gestion des utilisateurs</h2></div>
        <button type="button" onClick={loadUsers} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser</button>
      </div>
      {message && <p className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700">{message}</p>}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[760px] table-auto border-collapse">
          <thead><tr className="bg-slate-50 text-left text-xs font-black uppercase tracking-wide text-slate-600"><th className="p-3">Nom</th><th className="p-3">Email</th><th className="p-3">Matricule</th><th className="p-3">Rôle</th><th className="p-3">Statut</th><th className="p-3">Actions</th></tr></thead>
          <tbody>
            {users.map((user) => { const pending = pendingIds.has(String(user.id)); const isMessaging = messageUserId === String(user.id); return (
              <React.Fragment key={user.id}>
                <tr className="border-t bg-white text-sm">
                  <td className="p-3 font-semibold">{user.nom_complet}</td>
                  <td className="p-3 text-slate-600">{user.email}</td>
                  <td className="p-3 text-slate-600">{user.matricule || '—'}</td>
                  <td className="p-3">{user.role?.libelle || '—'}</td>
                  <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${pending ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{pending ? 'En attente' : user.statut}</span></td>
                  <td className="p-3">{pending
                    ? <div className="flex gap-2"><button type="button" onClick={() => decide(user, 'approve')} className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800"><Check className="h-4 w-4" /> Valider</button><button type="button" onClick={() => decide(user, 'reject')} className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800"><X className="h-4 w-4" /> Refuser</button></div>
                    : <div className="flex gap-2"><button type="button" onClick={() => isMessaging ? setMessageUserId(null) : openMessage(user)} className={`inline-flex items-center gap-1 ${isMessaging ? 'text-sky-800' : 'text-sky-600 hover:text-sky-800'}`}><Mail className="h-4 w-4" /> {isMessaging ? 'Fermer' : 'Envoyer un message'}</button></div>}
                  </td>
                </tr>
                {isMessaging && (
                  <tr className="border-t bg-sky-50/60">
                    <td colSpan={6} className="p-4">
                      <div className="space-y-2">
                        <p className="text-xs font-black uppercase tracking-wide text-sky-700">Message à {user.nom_complet} ({user.email}) — envoyé depuis l'email de l'administration</p>
                        <textarea
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          rows={4}
                          placeholder="Écrivez votre message ici…"
                          className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button type="button" onClick={() => { setMessageUserId(null); setMessageText(''); }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">Annuler</button>
                          <button type="button" onClick={() => sendMessage(user)} disabled={messageSending || !messageText.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-50"><Send className="h-4 w-4" /> {messageSending ? 'Envoi…' : 'Envoyer le message'}</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ); })}
            {!loading && users.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-sm text-slate-500">Aucun utilisateur trouvé.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="text-sm text-slate-600">Administrateurs actifs : {activeAdmins} / 5</div>
      {credentials && <TemporaryPasswordModal credentials={credentials} onClose={() => setCredentials(null)} />}
    </div>
  );
};

export default UserManagementPanel;
