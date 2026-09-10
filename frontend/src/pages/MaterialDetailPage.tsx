import { useEffect, useState, useRef, type FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Upload, Plus } from 'lucide-react';
import { materialsApi, usageApi } from '../api/resources';

interface UsageRow {
  id: string;
  date: string;
  quantity: number;
  notes: string;
  source: string;
}

const EMPTY_FORM = {
  name: '', description: '', unit: 'units', category: '', supplier: '',
  leadTimeDays: 7, currentStock: 0, totalStorageCapacity: 0, dailyUsage: 0, unitCost: 0,
};

export default function MaterialDetailPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [logDate, setLogDate] = useState('');
  const [logQty, setLogQty] = useState('');
  const [uploadMsg, setUploadMsg] = useState('');

  useEffect(() => {
    if (isNew || !id) return;
    Promise.all([materialsApi.get(id), usageApi.list(id)]).then(([m, u]) => {
      setForm({
        name: m.name, description: m.description, unit: m.unit, category: m.category,
        supplier: m.supplier, leadTimeDays: m.leadTimeDays, currentStock: m.currentStock,
        totalStorageCapacity: m.totalStorageCapacity, dailyUsage: m.dailyUsage, unitCost: m.unitCost,
      });
      setUsage(u);
      setLoading(false);
    });
  }, [id, isNew]);

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        const created = await materialsApi.create(form);
        navigate(`/inventory/${created.id}`);
      } else if (id) {
        await materialsApi.update(id, form);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id || isNew) return;
    if (!window.confirm('Delete this material?')) return;
    await materialsApi.remove(id);
    navigate('/inventory');
  }

  async function handleLogUsage(e: FormEvent) {
    e.preventDefault();
    if (!id || !logDate || !logQty) return;
    await usageApi.log({ materialId: id, date: logDate, quantity: Number(logQty) });
    const refreshed = await usageApi.list(id);
    setUsage(refreshed);
    setLogDate('');
    setLogQty('');
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    try {
      const res = await usageApi.upload(id, file);
      setUploadMsg((res.data as { message: string }).message);
      const refreshed = await usageApi.list(id);
      setUsage(refreshed);
    } catch {
      setUploadMsg('Upload failed');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <span className="loading-spinner" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <Link
        to="/inventory"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none', marginBottom: 16 }}
      >
        <ArrowLeft size={14} /> Inventory
      </Link>

      <div className="page-title" style={{ marginBottom: 20 }}>{isNew ? 'New material' : form.name}</div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="label">Name</label>
              <input className="input" required value={form.name} onChange={(e) => setField('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Unit</label>
              <input className="input" value={form.unit} onChange={(e) => setField('unit', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Category</label>
              <input className="input" value={form.category} onChange={(e) => setField('category', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Supplier</label>
              <input className="input" value={form.supplier} onChange={(e) => setField('supplier', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Current stock</label>
              <input className="input" type="number" value={form.currentStock} onChange={(e) => setField('currentStock', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="label">Storage capacity</label>
              <input className="input" type="number" value={form.totalStorageCapacity} onChange={(e) => setField('totalStorageCapacity', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="label">Lead time (days)</label>
              <input className="input" type="number" value={form.leadTimeDays} onChange={(e) => setField('leadTimeDays', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="label">Unit cost</label>
              <input className="input" type="number" step="0.01" value={form.unitCost} onChange={(e) => setField('unitCost', Number(e.target.value))} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={14} /> {saving ? 'Saving…' : 'Save'}
          </button>
          {!isNew && (
            <button type="button" className="btn btn-danger" onClick={handleDelete}>
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </form>

      {!isNew && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 13.5 }}>Usage log</span>
            <div>
              <input ref={fileInputRef} type="file" accept=".csv,.xml" onChange={handleFileUpload} style={{ display: 'none' }} id="usage-file" />
              <label htmlFor="usage-file" className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                <Upload size={13} /> Upload CSV/XML
              </label>
            </div>
          </div>
          {uploadMsg && (
            <div style={{ fontSize: 12.5, color: 'var(--success)', marginBottom: 10 }}>{uploadMsg}</div>
          )}

          <form onSubmit={handleLogUsage} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input className="input" type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} required style={{ maxWidth: 160 }} />
            <input className="input" type="number" placeholder="Quantity" value={logQty} onChange={(e) => setLogQty(e.target.value)} required style={{ maxWidth: 120 }} />
            <button type="submit" className="btn btn-secondary">
              <Plus size={13} /> Log usage
            </button>
          </form>

          {usage.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No usage logged yet.</div>
          ) : (
            <table>
              <thead>
                <tr><th>Date</th><th>Quantity</th><th>Source</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {usage.slice(0, 20).map((u) => (
                  <tr key={u.id}>
                    <td>{u.date}</td>
                    <td>{u.quantity}</td>
                    <td style={{ textTransform: 'capitalize' }}>{u.source.replace('_', ' ')}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
