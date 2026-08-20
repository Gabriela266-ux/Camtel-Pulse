interface ProgressIndicatorsProps {
  achatTotal?: number;
  objectifMensuel?: number;
  objectifTotalCalendrierAchat?: number;
}

function ProgressRow({ title, value }: { title: string; value: number }) {
  const safeValue = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-slate-700">{title}</span>
        <span className="font-mono text-sm font-black text-sky-700">
          {safeValue.toFixed(0)}%
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-sky-600 transition-all duration-300"
          style={{ width: `${safeValue}%` }}
        />
      </div>

      <div className="mt-1 flex justify-between text-xs text-slate-400">
        <span>0</span>
        <span>100%</span>
      </div>
    </div>
  );
}

export function ProgressIndicators({
  achatTotal = 0,
  objectifMensuel = 0,
  objectifTotalCalendrierAchat = 0,
}: ProgressIndicatorsProps) {
  // Barre 1 — progression vs Objectif mensuel : (AchatTotal / ObjectifMensuel) * 100
  const objectifRate = objectifMensuel > 0 ? (achatTotal / objectifMensuel) * 100 : 0;

  // Barre 2 — progression vs Objectif Total du Calendrier d'Achat :
  // (AchatTotal / ObjectifTotalCalendrierAchat) * 100
  const calendrierRate =
    objectifTotalCalendrierAchat > 0
      ? (achatTotal / objectifTotalCalendrierAchat) * 100
      : 0;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-6">
        <h3 className="text-sm font-black text-slate-800">Taux de progression (Sal in)</h3>
        <p className="mt-1 text-xs text-slate-500">
          Calculés à partir des données réelles du mois en cours.
        </p>
      </div>

      <div className="space-y-6">
        <ProgressRow title="En fonction de l'Objectif" value={objectifRate} />
        <ProgressRow title="En fonction du Calendrier d'Achat" value={calendrierRate} />
      </div>
    </section>
  );
}