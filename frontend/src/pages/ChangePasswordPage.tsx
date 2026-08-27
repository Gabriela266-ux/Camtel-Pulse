import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../api/services';
import { useAuth } from '../auth/AuthContext';

export const ChangePasswordPage: React.FC = () => {
  const { user, token, login, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmation) return setError('Les nouveaux mots de passe ne correspondent pas.');
    setSaving(true);
    setError(null);
    try {
      await apiService.changeTemporaryPassword(currentPassword, newPassword);
      if (user && token) login(token, { ...user, mustChangePassword: false });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Modification impossible.');
    } finally { setSaving(false); }
  };

  if (!user || !token) return null;
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
    <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
      <div><h1 className="text-xl font-black text-slate-900">Créer votre mot de passe</h1><p className="mt-1 text-sm text-slate-500">Le mot de passe temporaire doit être remplacé avant d’accéder à la plateforme.</p></div>
      <input required type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Mot de passe temporaire" className="w-full rounded-xl border p-3" />
      <input required minLength={8} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nouveau mot de passe" className="w-full rounded-xl border p-3" />
      <input required minLength={8} type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="Confirmer le nouveau mot de passe" className="w-full rounded-xl border p-3" />
      {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <button disabled={saving} className="w-full rounded-xl bg-sky-600 p-3 font-bold text-white disabled:opacity-50">{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
      <button type="button" onClick={logout} className="w-full text-sm font-bold text-slate-500">Se déconnecter</button>
    </form>
  </main>;
};
