import React, { useState } from 'react';

export interface TemporaryCredentials {
  name: string;
  email: string;
  matricule?: string;
  password: string;
}

export const TemporaryPasswordModal: React.FC<{ credentials: TemporaryCredentials; onClose: () => void }> = ({ credentials, onClose }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(`Utilisateur : ${credentials.name}\nMatricule : ${credentials.matricule || 'Non renseigné'}\nEmail : ${credentials.email}\nMot de passe temporaire : ${credentials.password}`);
    setCopied(true);
  };
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4">
    <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <h2 className="text-lg font-black text-slate-900">Compte créé avec succès</h2>
      <p className="mt-2 text-sm text-amber-700">Copiez ces informations maintenant. Le mot de passe ne pourra plus être affiché après fermeture.</p>
      <dl className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
        <div><dt className="font-bold text-slate-500">Utilisateur</dt><dd>{credentials.name}</dd></div>
        <div><dt className="font-bold text-slate-500">Matricule de connexion</dt><dd className="font-mono font-black">{credentials.matricule || 'Non renseigné'}</dd></div>
        <div><dt className="font-bold text-slate-500">Email</dt><dd>{credentials.email}</dd></div>
        <div><dt className="font-bold text-slate-500">Mot de passe temporaire</dt><dd className="font-mono text-base font-black">{credentials.password}</dd></div>
      </dl>
      <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={copy} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-bold text-white">{copied ? 'Copié' : 'Copier les identifiants'}</button><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-bold">Fermer</button></div>
    </div>
  </div>;
};
