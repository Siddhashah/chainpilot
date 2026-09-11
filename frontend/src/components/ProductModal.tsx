import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { productsApi } from '../api/resources';
import Modal from './Modal';
import type { ProductMaterial } from '../types';

const EMPTY_FORM = { name: '', description: '', sku: '', category: '', productionCycle: 'monthly' };
const EMPTY_MATERIAL: ProductMaterial = { materialName: '', quantity: 1, unit: 'units' };

interface ProductModalProps {
  productId?: string; // undefined = create mode
  onClose: () => void;
  onSaved: () => void;
}

export default function ProductModal({ productId, onClose, onSaved }: ProductModalProps) {
  const isNew = !productId;
  const [form, setForm] = useState(EMPTY_FORM);
  const [materials, setMaterials] = useState<ProductMaterial[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew || !productId) return;
    productsApi.get(productId).then((p) => {
      setForm({
        name: p.name,
        description: p.description,
        sku: p.sku,
        category: p.category,
        productionCycle: p.productionCycle,
      });
      setMaterials(p.materials ?? []);
      setLoading(false);
    });
  }, [productId, isNew]);

  function updateMaterial(idx: number, patch: Partial<ProductMaterial>) {
    setMaterials((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, materials: materials.filter((m) => m.materialName.trim()) };
      if (isNew) {
        await productsApi.create(payload);
      } else if (productId) {
        await productsApi.update(productId, payload);
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!productId) return;
    if (!window.confirm('Delete this product?')) return;
    await productsApi.remove(productId);
    onSaved();
    onClose();
  }

  return (
    <Modal title={isNew ? 'New product' : (form.name || 'Edit product')} onClose={onClose} width={480}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <span className="loading-spinner" />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="label">Name</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">SKU</label>
              <input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Category</label>
              <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Production cycle</label>
              <select className="input" value={form.productionCycle} onChange={(e) => setForm({ ...form, productionCycle: e.target.value })}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 8px' }}>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)' }}>Bill of materials</span>
            <button type="button" className="btn btn-secondary" onClick={() => setMaterials([...materials, { ...EMPTY_MATERIAL }])} style={{ padding: '4px 10px', fontSize: 12 }}>
              <Plus size={12} /> Add
            </button>
          </div>

          {materials.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {materials.map((m, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8 }}>
                  <input className="input" placeholder="Material name" value={m.materialName} onChange={(e) => updateMaterial(idx, { materialName: e.target.value })} />
                  <input className="input" type="number" placeholder="Qty" value={m.quantity ?? ''} onChange={(e) => updateMaterial(idx, { quantity: Number(e.target.value) })} />
                  <input className="input" placeholder="Unit" value={m.unit ?? ''} onChange={(e) => updateMaterial(idx, { unit: e.target.value })} />
                  <button type="button" className="btn btn-danger" onClick={() => setMaterials(materials.filter((_, i) => i !== idx))}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
              <Save size={14} /> {saving ? 'Saving…' : 'Save'}
            </button>
            {!isNew && (
              <button type="button" className="btn btn-danger" onClick={handleDelete}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
}
