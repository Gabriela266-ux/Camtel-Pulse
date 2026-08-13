import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { AppRole } from '../types';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('chef.operationnel@camtel.cm');
  const [password, setPassword] = useState('••••••••••••');
  const [role, setRole] = useState<AppRole>('OPERATIONNEL');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Enregistrement de la session
    login('fake-jwt-token-camtel-2026', {
      id: 1,
      nom_complet: role === 'CHEF_OPE' ? 'Chef Opérationnel CDPSM' : 'Opérationnel Glotelho',
      email,
      role,
      partenaireId: role === 'OPERATIONNEL' ? 101 : undefined,
    });

    // 2. Navigation dynamique vers le dashboard
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-md">
        <div className="text-xs font-bold text-sky-600 tracking-wider mb-2">
          CAMTEL-PULSE
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          Connexion Plateforme
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Identifiant / Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Rôle de démo
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AppRole)}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="OPERATIONNEL">Opérationnel</option>
              <option value="CHEF_OPE">Chef opérationnel</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-lg transition-colors mt-2 text-sm"
          >
            Se Connecter
          </button>
        </form>
      </div>
    </div>
  );
};
