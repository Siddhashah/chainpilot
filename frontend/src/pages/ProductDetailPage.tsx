import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { productsApi } from '../api/resources';
import type { ProductMaterial } from '../types';

const EMPTY_MATERIAL: ProductMaterial = { materialName: '', quantity: 1, unit: 'units' };

export default function ProductDetailPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    description: '',
    sku: '',
    category: '',
    productionCycle: 'monthly',
  });
  const [materials, setMaterials] = useState<ProductMaterial[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew || !id) return;
    productsApi.get(id).then((p) => {
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
  }, [id, isNew]);

  function updateMaterial(idx: number, patch: Partial<ProductMaterial>) {
    setMaterials((prev) => prev.map((m, i) => (i === idx ? { ...m, ...patch } : m)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, materials: materials.filter((m) => m.materialName.trim()) };
      if (isNew) {
        const created = await productsApi.create(payload);
        navigate(`/products/${created.id}`);
      } else if (id) {
        await productsApi.update(id, payload);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id || isNew) return;
    if (!window.confirm('Delete this product?')) return;
    await productsApi.remove(id);
    navigate('/products');
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <span className="loading-spinner" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <Link
        to="/products"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none', marginBottom: 16 }}
      >
        <ArrowLeft size={14} /> Products
      </Link>

      <div className="page-title" style={{ marginBottom: 20 }}>
        {isNew ? 'New product' : form.name}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="label">Name</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="label">SKU</label>
              <input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Category</label>
              <input
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="label">Production cycle</label>
              <select
                className="input"
                value={form.productionCycle}
                onChange={(e) => setForm({ ...form, productionCycle: e.target.value })}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 4 }}>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>

        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 13.5 }}>Bill of materials</span>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setMaterials([...materials, { ...EMPTY_MATERIAL }])}
            >
              <Plus size={14} /> Add material
            </button>
          </div>

          {materials.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>
              No materials added. Materials you add here are auto-created in Inventory if they don't already exist.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {materials.map((m, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                  <input
                    className="input"
                    placeholder="Material name"
                    value={m.materialName}
                    onChange={(e) => updateMaterial(idx, { materialName: e.target.value })}
                  />
                  <input
                    className="input"
                    type="number"
                    placeholder="Qty"
                    value={m.quantity ?? ''}
                    onChange={(e) => updateMaterial(idx, { quantity: Number(e.target.value) })}
                  />
                  <input
                    className="input"
                    placeholder="Unit"
                    value={m.unit ?? ''}
                    onChange={(e) => updateMaterial(idx, { unit: e.target.value })}
                  />
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => setMaterials(materials.filter((_, i) => i !== idx))}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
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
    </div>
  );
}
