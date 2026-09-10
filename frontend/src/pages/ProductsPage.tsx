import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Package } from 'lucide-react';
import { productsApi } from '../api/resources';
import type { Product } from '../types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsApi.list().then(setProducts).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div className="page-title">Products</div>
          <div className="page-subtitle">Products and their bill of materials</div>
        </div>
        <Link to="/products/new" className="btn btn-primary">
          <Plus size={15} /> New product
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <span className="loading-spinner" />
        </div>
      ) : products.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
          <Package size={28} style={{ marginBottom: 10, opacity: 0.5 }} />
          <div>No products yet</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Production cycle</th>
                <th>Materials</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/products/${p.id}`} style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
                      {p.name}
                    </Link>
                  </td>
                  <td>{p.sku || '—'}</td>
                  <td>{p.category || '—'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{p.productionCycle}</td>
                  <td>{p.materials?.length ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
