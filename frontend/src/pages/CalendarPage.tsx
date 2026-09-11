import { useEffect, useState, type FormEvent } from 'react';
import { ChevronLeft, ChevronRight, Grid3x3, List, Plus } from 'lucide-react';
import { calendarApi } from '../api/resources';
import Modal from '../components/Modal';
import type { CalendarEvent } from '../types';

type ViewMode = 'month' | 'agenda';

const PRIORITY_COLOR: Record<string, string> = {
  high: 'var(--danger)',
  medium: 'var(--warning)',
  low: 'var(--success)',
};

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function CalendarPage() {
  const [view, setView] = useState<ViewMode>('month');
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', type: 'custom', priority: 'medium' });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const currentKey = `${year}-${month}`;
  const [loadedKey, setLoadedKey] = useState('');
  if (currentKey !== loadedKey) {
    setLoadedKey(currentKey);
    setLoading(true);
  }

  useEffect(() => {
    let cancelled = false;
    calendarApi
      .list({ year: String(year), month: String(month + 1) })
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [year, month]);

  async function reload() {
    const data = await calendarApi.list({ year: String(year), month: String(month + 1) });
    setEvents(data);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    await calendarApi.create(form);
    setShowForm(false);
    setForm({ title: '', date: '', type: 'custom', priority: 'medium' });
    reload();
  }

  const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    (acc[ev.date] ??= []).push(ev);
    return acc;
  }, {});

  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  const todayStr = toISODate(new Date());

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div className="page-title">Calendar</div>
          <div className="page-subtitle">Resupply schedule and events</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', border: '1px solid var(--border-strong)', borderRadius: 6, overflow: 'hidden' }}>
            <button
              onClick={() => setView('month')}
              style={{
                padding: '7px 10px', border: 'none', cursor: 'pointer',
                background: view === 'month' ? 'var(--accent)' : 'var(--bg-card)',
                color: view === 'month' ? '#fff' : 'var(--text-secondary)', display: 'flex',
              }}
            >
              <Grid3x3 size={14} />
            </button>
            <button
              onClick={() => setView('agenda')}
              style={{
                padding: '7px 10px', border: 'none', cursor: 'pointer',
                background: view === 'agenda' ? 'var(--accent)' : 'var(--bg-card)',
                color: view === 'agenda' ? '#fff' : 'var(--text-secondary)', display: 'flex',
              }}
            >
              <List size={14} />
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={14} /> New event
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button className="btn btn-secondary" onClick={() => setCursor(new Date(year, month - 1, 1))}>
          <ChevronLeft size={14} />
        </button>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, minWidth: 140 }}>
          {cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button className="btn btn-secondary" onClick={() => setCursor(new Date(year, month + 1, 1))}>
          <ChevronRight size={14} />
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <span className="loading-spinner" />
        </div>
      ) : view === 'month' ? (
        <div className="card" style={{ padding: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', padding: 4 }}>
                {d}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {cells.map((date, i) => {
              const dateStr = date ? toISODate(date) : '';
              const dayEvents = date ? (eventsByDate[dateStr] ?? []) : [];
              return (
                <div
                  key={i}
                  style={{
                    minHeight: 84, borderRadius: 6, padding: 6,
                    background: dateStr === todayStr ? 'var(--accent-light)' : 'var(--bg-elevated)',
                    opacity: date ? 1 : 0.3,
                  }}
                >
                  {date && (
                    <>
                      <div style={{ fontSize: 11.5, fontWeight: 500, marginBottom: 4 }}>{date.getDate()}</div>
                      {dayEvents.slice(0, 3).map((ev) => (
                        <div
                          key={ev.id}
                          title={ev.title}
                          style={{
                            fontSize: 10, padding: '2px 5px', borderRadius: 3, marginBottom: 2,
                            background: ev.color || PRIORITY_COLOR[ev.priority] || 'var(--accent)',
                            color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}
                        >
                          {ev.title}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {events.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No events this month</div>
          ) : (
            [...events].sort((a, b) => a.date.localeCompare(b.date)).map((ev) => (
              <div
                key={ev.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.color || PRIORITY_COLOR[ev.priority], flexShrink: 0 }} />
                <div style={{ width: 90, fontSize: 12.5, color: 'var(--text-secondary)' }}>{ev.date}</div>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{ev.title}</div>
                {ev.materialName && <span className="badge badge-info">{ev.materialName}</span>}
                <span className="badge" style={{ textTransform: 'capitalize', background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                  {ev.type}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {showForm && (
        <Modal title="New event" onClose={() => setShowForm(false)} width={360}>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="label">Title</label>
              <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Date</label>
              <input className="input" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Create event
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
