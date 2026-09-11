import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Layers, ClipboardList } from 'lucide-react';
import { materialsApi, usageApi } from '../api/resources';
import Modal from '../components/Modal';
import MaterialModal from '../components/MaterialModal';
import type { Material } from '../types';

function stockColor(pct: number) {
  if (pct < 20) return 'var(--danger)';
  if (pct < 50) return 'var(--warning)';
  return 'var(--success)';
}

export default function InventoryPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [showLogUsage, setShowLogUsage] = useState(false);
  const [logForm, setLogForm] = useState({ materialId: '', date: '', quantity: '', notes: '' });
  const [savingLog, setSavingLog] = useState(false);
  const [logError, setLogError] = useState('');

  function load() {
    materialsApi.list().then(setMaterials).finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openLogUsage() {
    setLogForm({ materialId: materials[0]?.id ?? '', date: new Date().toISOString().slice(0, 10), quantity: '', notes: '' });
    setLogError('');
    setShowLogUsage(true);
  }

  async function handleLogUsage(e: FormEvent) {
    e.preventDefault();
    setSavingLog(true);
    setLogError('');
    try {
      await usageApi.log({
        materialId: logForm.materialId,
        date: logForm.date,
        quantity: Number(logForm.quantity),
        notes: logForm.notes,
      });
      setShowLogUsage(false);
      load();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to log usage';
      setLogError(message);
    } finally {
      setSavingLog(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div className="page-title">Inventory</div>
          <div className="page-subtitle">Stock levels across all materials</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={openLogUsage} disabled={!materials.length}>
            <ClipboardList size={15} /> Log usage
          </button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={15} /> New material
          </button>
        </div>
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
                <tr key={m.id} onClick={() => setEditingId(m.id)} style={{ cursor: 'pointer' }}>
                  <td style={{ color: 'var(--accent)', fontWeight: 500 }}>{m.name}</td>
                  <td>{m.currentStock} {m.unit}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 5, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, m.stockPercentage)}%`, height: '100%', background: stockColor(m.stockPercentage) }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 32 }}>{m.stockPercentage}%</span>
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

      {showAdd && <MaterialModal onClose={() => setShowAdd(false)} onSaved={load} />}
      {editingId && (
        <MaterialModal materialId={editingId} onClose={() => setEditingId(null)} onSaved={load} />
      )}

      {showLogUsage && (
        <Modal title="Log usage" onClose={() => setShowLogUsage(false)} width={380}>
          <form onSubmit={handleLogUsage}>
            {logError && (
              <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', fontSize: 12.5, padding: '8px 12px', borderRadius: 6, marginBottom: 14 }}>
                {logError}
              </div>
            )}
            <div className="form-group">
              <label className="label">Material</label>
              <select className="input" required value={logForm.materialId} onChange={(e) => setLogForm({ ...logForm, materialId: e.target.value })}>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="label">Date</label>
                <input className="input" type="date" required value={logForm.date} onChange={(e) => setLogForm({ ...logForm, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="label">Quantity</label>
                <input className="input" type="number" required value={logForm.quantity} onChange={(e) => setLogForm({ ...logForm, quantity: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Notes (optional)</label>
              <input className="input" value={logForm.notes} onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingLog} style={{ width: '100%', justifyContent: 'center' }}>
              {savingLog ? 'Logging…' : 'Log usage'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
