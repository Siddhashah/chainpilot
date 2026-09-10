import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Layers } from 'lucide-react';
import { materialsApi } from '../api/resources';
import type { Material } from '../types';

function stockColor(pct: number) {
  if (pct < 20) return 'var(--danger)';
  if (pct < 50) return 'var(--warning)';
  return 'var(--success)';
}

export default function InventoryPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    materialsApi.list().then(setMaterials).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div className="page-title">Inventory</div>
          <div className="page-subtitle">Stock levels across all materials</div>
        </div>
        <Link to="/inventory/new" className="btn btn-primary">
          <Plus size={15} /> New material
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <span className="loading-spinner" />
        </div>
      ) : materials.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
          <Layers size={28} style={{ marginBottom: 10, opacity: 0.5 }} />
          <div>No materials yet</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Stock</th>
                <th style={{ width: 140 }}>Capacity</th>
                <th>Daily usage</th>
                <th>Days left</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((m) => (
                <tr key={m.id}>
                  <td>
                    <Link to={`/inventory/${m.id}`} style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
                      {m.name}
                    </Link>
                  </td>
                  <td>{m.currentStock} {m.unit}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 5, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(100, m.stockPercentage)}%`,
                            height: '100%',
                            background: stockColor(m.stockPercentage),
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 32 }}>
                        {m.stockPercentage}%
                      </span>
                    </div>
                  </td>
                  <td>{m.dailyUsage} {m.unit}/day</td>
                  <td>{m.daysUntilStockout ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
