import { useEffect, useState, useRef, type FormEvent } from 'react';
import { Save, Trash2, Upload, Plus } from 'lucide-react';
import { materialsApi, usageApi } from '../api/resources';
import Modal from './Modal';

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

interface MaterialModalProps {
  materialId?: string;   // omit for "add new" mode
  onClose: () => void;
  onSaved: () => void;   // called after create/update/delete so the list can refresh
}

export default function MaterialModal({ materialId, onClose, onSaved }: MaterialModalProps) {
  const isNew = !materialId;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [logDate, setLogDate] = useState('');
  const [logQty, setLogQty] = useState('');
  const [uploadMsg, setUploadMsg] = useState('');

  useEffect(() => {
    if (isNew || !materialId) return;
    Promise.all([materialsApi.get(materialId), usageApi.list(materialId)]).then(([m, u]) => {
      setForm({
        name: m.name, description: m.description, unit: m.unit, category: m.category,
        supplier: m.supplier, leadTimeDays: m.leadTimeDays, currentStock: m.currentStock,
        totalStorageCapacity: m.totalStorageCapacity, dailyUsage: m.dailyUsage, unitCost: m.unitCost,
      });
      setUsage(u);
      setLoading(false);
    });
  }, [materialId, isNew]);

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        await materialsApi.create(form);
      } else {
        await materialsApi.update(materialId, form);
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!materialId) return;
    if (!window.confirm('Delete this material?')) return;
    await materialsApi.remove(materialId);
    onSaved();
    onClose();
  }

  async function handleLogUsage(e: FormEvent) {
    e.preventDefault();
    if (!materialId || !logDate || !logQty) return;
    await usageApi.log({ materialId, date: logDate, quantity: Number(logQty) });
    setUsage(await usageApi.list(materialId));
    setLogDate('');
    setLogQty('');
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !materialId) return;
    try {
      const res = await usageApi.upload(materialId, file);
      setUploadMsg((res.data as { message: string }).message);
      setUsage(await usageApi.list(materialId));
    } catch {
      setUploadMsg('Upload failed');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <Modal title={isNew ? 'New material' : form.name || 'Material'} onClose={onClose} width={520}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <span className="loading-spinner" />
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

            <div style={{ display: 'flex', gap: 10, marginTop: 4, marginBottom: isNew ? 0 : 20 }}>
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
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 13.5 }}>Usage log</span>
                <div>
                  <input ref={fileInputRef} type="file" accept=".csv,.xml" onChange={handleFileUpload} style={{ display: 'none' }} id="usage-file-modal" />
                  <label htmlFor="usage-file-modal" className="btn btn-secondary" style={{ cursor: 'pointer', fontSize: 12 }}>
                    <Upload size={13} /> Upload CSV/XML
                  </label>
                </div>
              </div>
              {uploadMsg && <div style={{ fontSize: 12.5, color: 'var(--success)', marginBottom: 10 }}>{uploadMsg}</div>}

              <form onSubmit={handleLogUsage} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <input className="input" type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} required style={{ maxWidth: 150 }} />
                <input className="input" type="number" placeholder="Quantity" value={logQty} onChange={(e) => setLogQty(e.target.value)} required style={{ maxWidth: 110 }} />
                <button type="submit" className="btn btn-secondary">
                  <Plus size={13} /> Log
                </button>
              </form>

              {usage.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No usage logged yet.</div>
              ) : (
                <table>
                  <thead>
                    <tr><th>Date</th><th>Quantity</th><th>Source</th></tr>
                  </thead>
                  <tbody>
                    {usage.slice(0, 10).map((u) => (
                      <tr key={u.id}>
                        <td>{u.date}</td>
                        <td>{u.quantity}</td>
                        <td style={{ textTransform: 'capitalize' }}>{u.source.replace('_', ' ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
