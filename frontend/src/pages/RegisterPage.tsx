import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Boxes } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SupplyChainIllustration from '../components/SupplyChainIllustration';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <div
        style={{
          flex: 1,
          background: 'var(--bg-sidebar)',
          color: 'var(--accent)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
        }}
      >
        <SupplyChainIllustration />
        <div style={{ marginTop: 24, textAlign: 'center', maxWidth: 340 }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 26,
              fontWeight: 600,
              color: '#EAF6F7',
              marginBottom: 10,
            }}
          >
            Set up in minutes
          </h1>
          <p style={{ fontSize: 13, color: '#7E9A9D', lineHeight: 1.7 }}>
            Add your products and materials, and let the forecasting engine take it from there.
          </p>
        </div>
      </div>

      <div
        style={{
          width: 440,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
        }}
      >
        <div style={{ width: '100%', maxWidth: 340 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
            <Boxes size={20} color="var(--accent)" />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>
              ChainPilot
            </span>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Create account</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
            Already have one?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>
              Sign in
            </Link>
          </p>

          {error && (
            <div
              style={{
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                fontSize: 12.5,
                padding: '8px 12px',
                borderRadius: 6,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="label" htmlFor="name">
                  Full name
                </label>
                <input id="name" className="input" required value={form.name} onChange={set('name')} />
              </div>
              <div className="form-group">
                <label className="label" htmlFor="company">
                  Company
                </label>
                <input id="company" className="input" value={form.company} onChange={set('company')} />
              </div>
            </div>
            <div className="form-group">
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="input"
                type="email"
                required
                value={form.email}
                onChange={set('email')}
              />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className="input"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={set('password')}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '10px 0', marginTop: 8 }}
            >
              {loading ? (
                <span className="loading-spinner" style={{ width: 14, height: 14 }} />
              ) : (
                <>
                  Create account <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
