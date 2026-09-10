import { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { materialsApi, predictionsApi } from '../api/resources';
import type { Material, Prediction } from '../types';

const TREND_ICON = { increasing: TrendingUp, decreasing: TrendingDown, stable: Minus, volatile: Minus };

export default function PredictionsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<Record<string, string>>({});

  function load() {
    Promise.all([materialsApi.list(), predictionsApi.list()]).then(([mats, preds]) => {
      setMaterials(mats);
      setPredictions(preds);
      if (!selected && preds.length) setSelected(preds[0].materialId);
    }).finally(() => setLoading(false));
  }

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGenerate(materialId: string) {
    setGenerating(materialId);
    setError((e) => ({ ...e, [materialId]: '' }));
    try {
      await predictionsApi.generate(materialId);
      const preds = await predictionsApi.list();
      setPredictions(preds);
      setSelected(materialId);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Prediction failed';
      setError((e) => ({ ...e, [materialId]: message }));
    } finally {
      setGenerating(null);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <span className="loading-spinner" />
      </div>
    );
  }

  const activePrediction = predictions.find((p) => p.materialId === selected);
  const predictedIds = new Set(predictions.map((p) => p.materialId));

  return (
    <div>
      <div className="page-title">Predictions</div>
      <div className="page-subtitle" style={{ marginBottom: 20 }}>
        ML-generated resupply forecasts, compared across models
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 0 }}>
          {materials.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px',
                border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                background: selected === m.id ? 'var(--accent-light)' : 'transparent',
                color: 'var(--text-primary)', fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 500 }}>{m.name}</div>
              {predictedIds.has(m.id) ? (
                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>Prediction available</div>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={generating === m.id}
                  onClick={(e) => { e.stopPropagation(); handleGenerate(m.id); }}
                  style={{ marginTop: 6, fontSize: 11.5, padding: '4px 10px' }}
                >
                  <Sparkles size={11} /> {generating === m.id ? 'Generating…' : 'Generate'}
                </button>
              )}
              {error[m.id] && <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>{error[m.id]}</div>}
            </button>
          ))}
        </div>

        <div>
          {!activePrediction ? (
            <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a material and generate a prediction to see it here.
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                <div className="card stat-card">
                  <div className="stat-label">Daily usage</div>
                  <div className="stat-value">{activePrediction.predictedDailyUsage}</div>
                </div>
                <div className="card stat-card">
                  <div className="stat-label">Stockout date</div>
                  <div className="stat-value" style={{ fontSize: 16 }}>{activePrediction.estimatedStockoutDate ?? '—'}</div>
                </div>
                <div className="card stat-card">
                  <div className="stat-label">Resupply by</div>
                  <div className="stat-value" style={{ fontSize: 16, color: 'var(--accent)' }}>{activePrediction.recommendedResupplyDate ?? '—'}</div>
                </div>
                <div className="card stat-card">
                  <div className="stat-label">Confidence</div>
                  <div className="stat-value">{activePrediction.confidence ? `${Math.round(activePrediction.confidence * 100)}%` : '—'}</div>
                </div>
              </div>

              <div className="card" style={{ padding: 0, marginBottom: 16 }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Model comparison
                  {activePrediction.trend && (() => {
                    const Icon = TREND_ICON[activePrediction.trend as keyof typeof TREND_ICON] ?? Minus;
                    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'capitalize' }}><Icon size={13} /> {activePrediction.trend}</span>;
                  })()}
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Model</th><th>Status</th><th>MAPE</th><th>MAE</th><th>RMSE</th><th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePrediction.modelsCompared?.map((m) => (
                      <tr key={m.modelName}>
                        <td style={{ fontWeight: 500 }}>
                          {m.modelName.replace(/_/g, ' ')}
                          {m.modelName === activePrediction.bestModel && (
                            <span className="badge badge-success" style={{ marginLeft: 8 }}>Best</span>
                          )}
                        </td>
                        <td>
                          {m.success ? (
                            <span className="badge badge-success">Success</span>
                          ) : (
                            <span className="badge badge-danger">Failed</span>
                          )}
                        </td>
                        <td>{m.mape != null ? `${m.mape.toFixed(1)}%` : '—'}</td>
                        <td>{m.mae != null ? m.mae.toFixed(2) : '—'}</td>
                        <td>{m.rmse != null ? m.rmse.toFixed(2) : '—'}</td>
                        <td>{m.confidence != null ? `${Math.round(m.confidence * 100)}%` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                className="btn btn-secondary"
                disabled={generating === activePrediction.materialId}
                onClick={() => handleGenerate(activePrediction.materialId)}
              >
                <Sparkles size={14} /> Regenerate prediction
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
