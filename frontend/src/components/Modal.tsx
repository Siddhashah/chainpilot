import { type ReactNode, type MouseEvent } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}

export default function Modal({ title, onClose, children, width = 420 }: ModalProps) {
  function stop(e: MouseEvent) {
    e.stopPropagation();
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div className="card" style={{ padding: 20, width, maxHeight: '85vh', overflowY: 'auto' }} onClick={stop}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
