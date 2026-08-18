interface ProgressIndicatorsProps {
  realizationRate?: number;
  weeklyAverageStock?: number;
}

function ProgressRow({
  title,
  value,
  suffix,
}: {
  title: string;
  value: number;
  suffix: string;
}) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-slate-700">{title}</span>
        <span className="font-mono text-sm font-black text-sky-700">
          {safeValue.toFixed(0)}{suffix}
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
  realizationRate = 0,
  weeklyAverageStock = 0,
}: ProgressIndicatorsProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-6">
        <h3 className="text-sm font-black text-slate-800">Indicateurs hebdomadaires</h3>
        <p className="mt-1 text-xs text-slate-500">
          Calculés à partir des données saisies.
        </p>
      </div>

      <div className="space-y-6">
        <ProgressRow
          title="Taux de réalisation (Sale In)"
          value={realizationRate}
          suffix="%"
        />

        <ProgressRow
          title="Stock journalier moyen hebdomadaire"
          value={weeklyAverageStock}
          suffix="%"
        />
      </div>
    </section>
  );
}