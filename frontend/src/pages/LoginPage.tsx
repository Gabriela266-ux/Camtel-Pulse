import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, SunMedium } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { apiService } from '../api/services';

interface LoginPageProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ isDark, onToggleTheme }) => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('chef@camtel.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { token, user } = await apiService.login(email, password);
      login(token, user);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible');
    } finally {
      setLoading(false);
    }
  };

  const shellClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800';
  const cardClass = isDark ? 'border-slate-700 bg-slate-900 shadow-slate-950/30' : 'border-slate-200 bg-white shadow-slate-200/60';
  const inputClass = isDark
    ? 'border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-400 focus:ring-sky-500'
    : 'border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:ring-sky-500';

  return (
    <div className={`min-h-screen flex items-center justify-center font-sans p-4 ${shellClass}`}>
      <div className="absolute right-4 top-4">
        <button
          type="button"
          onClick={onToggleTheme}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
            isDark
              ? 'border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
          }`}
          aria-label="Basculer le thème"
          title="Basculer le thème"
        >
          {isDark ? <SunMedium className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          {isDark ? 'Mode clair' : 'Mode sombre'}
        </button>
      </div>

      <div className={`w-full max-w-md rounded-3xl border p-8 shadow-xl shadow-slate-200/30 ${cardClass}`}>
        <div className="mb-2 text-xs font-black tracking-[0.25em] text-sky-600">CAMTEL-PULSE</div>
        <h2 className={`mb-6 text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
          Connexion Plateforme
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`mb-1 block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Identifiant / Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full rounded-lg border p-2.5 text-sm focus:outline-none focus:ring-2 ${inputClass}`}
              required
            />
          </div>

          <div>
            <label className={`mb-1 block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full rounded-lg border p-2.5 text-sm focus:outline-none focus:ring-2 ${inputClass}`}
              required
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm font-medium text-red-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="ui-button-primary mt-2 w-full py-3 disabled:opacity-60"
          >
            {loading ? 'Connexion…' : 'Se Connecter'}
          </button>
        </form>
      </div>
    </div>
  );
};
