import { useEffect, useState } from 'react';
import { AlertTriangle, Package, Layers, Sparkles } from 'lucide-react';
import { materialsApi } from '../api/resources';
import { productsApi } from '../api/resources';
import { predictionsApi } from '../api/resources';
import type { Material } from '../types';

export default function DashboardPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [predictionCount, setPredictionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([materialsApi.list(), productsApi.list(), predictionsApi.list()])
      .then(([mats, products, predictions]) => {
        setMaterials(mats);
        setProductCount(products.length);
        setPredictionCount(predictions.length);
      })
      .finally(() => setLoading(false));
  }, []);

  const critical = materials
    .filter((m) => m.stockPercentage < 20)
    .sort((a, b) => a.stockPercentage - b.stockPercentage);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <span className="loading-spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-title">Dashboard</div>
      <div className="page-subtitle" style={{ marginBottom: 20 }}>
        A glance at where things stand
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-label">Materials tracked</div>
          <div className="stat-value">{materials.length}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Products</div>
          <div className="stat-value">{productCount}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Predictions run</div>
          <div className="stat-value">{predictionCount}</div>
        </div>
        <div className="card stat-card" style={{ background: critical.length ? 'var(--danger-bg)' : undefined }}>
          <div className="stat-label" style={{ color: critical.length ? 'var(--danger)' : undefined }}>
            Critical stock
          </div>
          <div className="stat-value" style={{ color: critical.length ? 'var(--danger)' : undefined }}>
            {critical.length}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 600,
            fontSize: 13.5,
          }}
        >
          <AlertTriangle size={15} color="var(--danger)" />
          Critical stock alerts
        </div>
        {critical.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Nothing below 20% capacity right now.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Stock</th>
                <th>Days left</th>
              </tr>
            </thead>
            <tbody>
              {critical.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.stockPercentage}%</td>
                  <td>{m.daysUntilStockout ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Package size={13} /> Products
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Layers size={13} /> Inventory
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Sparkles size={13} /> Predictions
        </span>
      </div>
    </div>
  );
}
