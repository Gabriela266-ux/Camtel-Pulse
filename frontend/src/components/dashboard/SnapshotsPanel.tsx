import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Eye, Maximize2, Minimize2, RefreshCw, Trash2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { apiService } from '../../api/services';

interface SnapshotsPanelProps {
  isDark?: boolean;
  allowDelete?: boolean;
}

const typeLabels: Record<string, string> = {
  DA: 'Partenaire',
  DSM: 'DSM',
  POS: 'POS',
  CENTRE: 'Centre',
};

// Liste des tableaux « Suivi journalier » enregistrés en base.
// Consultation + téléchargement CSV uniquement — aucun snapshot n'est modifiable.
export const SnapshotsPanel: React.FC<SnapshotsPanelProps> = ({ isDark = false, allowDelete = false }) => {
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<any | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [detailZoom, setDetailZoom] = useState(100);
  const [isDetailFullscreen, setIsDetailFullscreen] = useState(false);

  useEffect(() => {
    if (!selectedSnapshot) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isDetailFullscreen) {
          setIsDetailFullscreen(false);
        } else {
          setSelectedSnapshot(null);
        }
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedSnapshot, isDetailFullscreen]);

  const load = () => {
    setLoading(true);
    setError(null);
    apiService
      .getSnapshots()
      .then((data) => setSnapshots(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Impossible de charger les tableaux enregistrés :', err);
        setError(err instanceof Error ? err.message : 'Chargement impossible');
        setSnapshots([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDownload = async (snapshot: any) => {
    setDownloadingId(snapshot.id);
    try {
      await apiService.downloadSnapshot(
        snapshot.id,
        `suivi-${(snapshot.entite_type || 'entite').toLowerCase()}-${snapshot.periode}.csv`
      );
    } catch (err) {
      console.error('Échec du téléchargement :', err);
      setError(err instanceof Error ? err.message : 'Téléchargement impossible');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleView = async (snapshot: any) => {
    setViewLoading(true);
    setError(null);
    try {
      setSelectedSnapshot(await apiService.getSnapshot(snapshot.id));
      setDetailZoom(100);
      setIsDetailFullscreen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Consultation impossible');
    } finally {
      setViewLoading(false);
    }
  };

  const handleDelete = async (snapshot: any) => {
    if (!window.confirm(`Supprimer le tableau ${snapshot.periode} ?`)) return;
    setDeletingId(snapshot.id);
    try {
      await apiService.deleteSnapshot(snapshot.id);
      setSnapshots((current) => current.filter((item) => item.id !== snapshot.id));
      if (selectedSnapshot?.id === snapshot.id) setSelectedSnapshot(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression impossible');
    } finally {
      setDeletingId(null);
    }
  };

  const formatCreatedAt = (value: string | undefined) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  };

  const shellClass = isDark ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-700';

  return (
    <section className={`overflow-hidden rounded-xl border shadow-sm ${shellClass}`}>
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3.5 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
        <div>
          <h3 className={`text-sm font-black ${isDark ? 'text-slate-100' : 'text-slate-700'}`}>
            Tableaux enregistrés
          </h3>
          <p className={`mt-0.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Historique immuable enregistré par les opérationnels — consultation et téléchargement uniquement.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${
            isDark
              ? 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Rafraîchir
        </button>
      </div>

      {error && (
        <div className="border-b border-red-200 bg-red-50 px-5 py-2 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className={isDark ? 'bg-slate-800' : 'bg-slate-50'}>
                {['Entité', 'Période', 'Lignes', 'Total Stock (U)', 'Total Calendrier (U)', 'Total Achat (U)', 'Cumul (U)', 'Enregistré le', 'Par', 'Actions'].map((column, i) => (
                <th
                  key={column || `action-${i}`}
                  className={`whitespace-nowrap border-b px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-wide ${
                    isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-400'
                  }`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {snapshots.map((snapshot) => (
              <tr
                key={snapshot.id}
                className={isDark ? 'odd:bg-slate-900 even:bg-slate-800/60' : 'odd:bg-white even:bg-slate-50/50'}
              >
                <td className={`whitespace-nowrap px-4 py-2.5 font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  {typeLabels[snapshot.entite_type] || snapshot.entite_type} — {snapshot.entite_nom || snapshot.entite_id.slice(0, 8)}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono">{snapshot.periode}</td>
                <td className="px-4 py-2.5 font-mono">{snapshot.lignes}</td>
                <td className="px-4 py-2.5 font-mono">{Number(snapshot.total_stock).toLocaleString('fr-FR')}</td>
                <td className="px-4 py-2.5 font-mono">{Number(snapshot.total_prevision).toLocaleString('fr-FR')}</td>
                <td className="px-4 py-2.5 font-mono font-bold text-sky-600">
                  {Number(snapshot.total_achat).toLocaleString('fr-FR')}
                </td>
                <td className="px-4 py-2.5 font-mono">{Number(snapshot.cumul_achat_final).toLocaleString('fr-FR')}</td>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono">
                  {formatCreatedAt(snapshot.created_at)}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">{snapshot.auteur || '—'}</td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleView(snapshot)}
                    disabled={viewLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Voir le tableau enregistré"
                  >
                    <Eye className="h-4 w-4" />
                    Voir
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(snapshot)}
                    disabled={downloadingId === snapshot.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download className={`h-4 w-4 ${downloadingId === snapshot.id ? 'animate-bounce' : ''}`} />
                    CSV
                  </button>
                  {allowDelete && (
                    <button
                      type="button"
                      onClick={() => handleDelete(snapshot)}
                      disabled={deletingId === snapshot.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Supprimer le tableau enregistré"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>
                  )}
                  </div>
                </td>
              </tr>
            ))}

            {!loading && snapshots.length === 0 && (
              <tr>
                <td colSpan={10} className={`px-4 py-10 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Aucun tableau enregistré pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedSnapshot && createPortal((
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm ${isDetailFullscreen ? 'p-0' : 'p-4'}`}>
          <div className={`flex max-h-[90vh] w-full flex-col overflow-hidden border shadow-2xl ${isDetailFullscreen ? 'h-full max-w-none rounded-none' : 'max-w-5xl rounded-2xl'} ${shellClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
              <div><p className="text-xs font-black uppercase tracking-wide text-sky-600">Tableau enregistré</p><h3 className="mt-1 text-lg font-black">{selectedSnapshot.entite_nom || selectedSnapshot.entite_id} · {selectedSnapshot.periode}</h3></div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDetailZoom((current) => Math.max(80, current - 10))}
                  disabled={detailZoom <= 80}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800"
                  aria-label="Réduire le zoom"
                  title="Réduire le zoom"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="min-w-12 text-center text-xs font-bold text-slate-500">{detailZoom}%</span>
                <button
                  type="button"
                  onClick={() => setDetailZoom((current) => Math.min(140, current + 10))}
                  disabled={detailZoom >= 140}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800"
                  aria-label="Augmenter le zoom"
                  title="Augmenter le zoom"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsDetailFullscreen((current) => !current)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label={isDetailFullscreen ? 'Quitter le plein écran' : 'Afficher en plein écran'}
                  title={isDetailFullscreen ? 'Quitter le plein écran' : 'Afficher en plein écran'}
                >
                  {isDetailFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button type="button" onClick={() => setSelectedSnapshot(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Fermer" title="Fermer (Échap)"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-5"><div style={{ fontSize: `${detailZoom}%`, transformOrigin: 'top left' }}><table className="w-full min-w-[700px] border-collapse text-xs"><thead><tr className="bg-slate-50 text-left dark:bg-slate-800">{['Date', 'Prévision', 'Achat', 'Stock', 'Cumul achat', 'Statut'].map((column) => <th key={column} className="border-b border-slate-200 px-3 py-2 font-black dark:border-slate-700">{column}</th>)}</tr></thead><tbody>{(selectedSnapshot.payload || []).map((row: any, index: number) => <tr key={`${row.date || 'row'}-${index}`} className="border-b border-slate-100 dark:border-slate-800"><td className="px-3 py-2">{row.date || '—'}</td><td className="px-3 py-2">{Number(row.prevision_ca || 0).toLocaleString('fr-FR')}</td><td className="px-3 py-2">{Number(row.achat || 0).toLocaleString('fr-FR')}</td><td className="px-3 py-2">{row.stock_journalier ?? '—'}</td><td className="px-3 py-2">{Number(row.cumul_achat || 0).toLocaleString('fr-FR')}</td><td className="px-3 py-2">{row.statut || '—'}</td></tr>)}</tbody></table></div></div>
          </div>
        </div>
      ), document.body)}
    </section>
  );
};

export default SnapshotsPanel;
