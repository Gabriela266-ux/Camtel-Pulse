import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiService } from '../../api/services';

export const ImportsPanel: React.FC = () => {
  const [csvContent, setCsvContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      setError(null);
      setResult(null);

      setProgress(0); // Reset for visual feedback
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvContent.trim()) {
      setError('Veuillez d\'abord sélectionner un fichier CSV');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      // Simulate progress updates (real progress would come from backend)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + Math.random() * 20, 90));
      }, 500);

      const response = await apiService.importCsv(csvContent);

      clearInterval(progressInterval);
      setProgress(100);

      setResult({
        success: true,
        imported: response.data?.imported || response.data?.records?.length || 0,
        message: response.message || 'Import complété avec succès',
      });

      setCsvContent('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors de l\'import. Vérifiez le format CSV et la taille du fichier.'
      );
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">Importer Données</h2>
        <p className="text-sm text-slate-600">
          Télécharger un fichier CSV pour importer des centres, DA, DSM, POS.
        </p>
      </div>

      {/* File input */}
      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-sky-400 transition">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={loading}
          className="hidden"
          id="csv-input"
        />
        <label htmlFor="csv-input" className="cursor-pointer">
          <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <p className="text-sm font-medium text-slate-700">
            Cliquer pour sélectionner un fichier CSV
          </p>
          <p className="text-xs text-slate-500">ou glisser-déposer</p>
        </label>
      </div>

      {/* File info */}
      {csvContent && (
        <div className="p-3 bg-slate-100 rounded text-sm">
          <p>
            <strong>{csvContent.split('\n').length - 1}</strong> lignes détectées
          </p>
          <p className="text-xs text-slate-600">
            Taille: {(csvContent.length / 1024).toFixed(2)} KB
          </p>
        </div>
      )}

      {/* Progress bar */}
      {loading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>En cours d'import...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-sky-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded flex gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Erreur</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Success result */}
      {result?.success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded flex gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Succès</p>
            <p className="text-sm text-green-700">
              {result.imported} enregistrement(s) importé(s)
            </p>
          </div>
        </div>
      )}

      {/* Import button */}
      <button
        onClick={handleImport}
        disabled={!csvContent || loading}
        className={`w-full py-2 rounded font-medium transition ${
          csvContent && !loading
            ? 'bg-sky-600 text-white hover:bg-sky-700'
            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
        }`}
      >
        {loading ? 'Import en cours...' : 'Lancer Import'}
      </button>
    </div>
  );
};

export default ImportsPanel;
