import React from 'react';
import { Icon } from './icons';

/** Banner de error de conexion: sigue siendo visible (ver CLAUDE.md, bug 5) y ofrece reintentar. */
export function ErrorAlert({ message, onRetry, detail }: { message: string; onRetry: () => void; detail?: string | null }) {
  return (
    <div role="alert" className="cb-alert cb-noprint">
      <Icon name="warn" size={20} stroke={2} />
      <p>
        <strong>{message}</strong> Mostramos “–” hasta que vuelva la conexión.
        {detail ? <span style={{ display: 'block', fontSize: 12.5, opacity: 0.85, marginTop: 2 }}>{detail}</span> : null}
      </p>
      <button type="button" className="cb-btn cb-alert-btn" onClick={onRetry}>
        <Icon name="refresh" size={15} stroke={2.2} />
        Reintentar
      </button>
    </div>
  );
}

/** Esqueleto de la fila de fichas */
export function TilesSkeleton() {
  return (
    <div aria-hidden="true" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          style={{
            flex: '1 1 160px', minWidth: 0, minHeight: 104, background: 'var(--card)', boxShadow: 'var(--shadow)',
            borderRadius: 18, padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
          }}
        >
          <div className="cb-skel" style={{ height: 10, width: '70%', borderRadius: 5 }} />
          <div className="cb-skel" style={{ height: 26, width: '45%', borderRadius: 8 }} />
          <div className="cb-skel" style={{ height: 4, width: '100%', borderRadius: 999 }} />
        </div>
      ))}
    </div>
  );
}

/** Esqueleto del detalle (graficos y tarjetas) mientras carga */
export function PanelSkeleton() {
  const bars = [3.4, 3.9, 3.6, 3.7, 4.1, 2.2, 0.8, 3.6, 4.0, 3.5, 3.8, 4.3, 2.4, 0.7, 3.7, 4.2, 3.9, 3.6, 4.4, 2.5, 0.9, 3.9, 4.1, 4.0, 3.8, 4.5, 2.3, 0.8, 3.6, 1.8];
  const card: React.CSSProperties = {
    minWidth: 0, minHeight: 228, background: 'var(--card)', boxShadow: 'var(--shadow)', borderRadius: 22, padding: '18px 22px',
    display: 'flex', flexDirection: 'column', gap: 10,
  };
  return (
    <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: -6 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ ...card, flex: '7 1 520px' }}>
          <div className="cb-skel" style={{ height: 14, width: '42%', borderRadius: 7 }} />
          <div className="cb-skel" style={{ height: 10, width: '22%', borderRadius: 5 }} />
          <div style={{ height: 148, marginTop: 6, display: 'flex', alignItems: 'flex-end', marginRight: 44 }}>
            {bars.map((v, i) => (
              <div key={i} style={{ flex: '1 1 0', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <div className="cb-skel" style={{ width: '56%', maxWidth: 12, borderRadius: 4, height: `${((v / 5) * 88).toFixed(1)}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ ...card, flex: '5 1 340px', gap: 16 }}>
          <div className="cb-skel" style={{ height: 14, width: '56%', borderRadius: 7 }} />
          <div className="cb-skel" style={{ height: 24, width: '30%', borderRadius: 8, marginTop: 14 }} />
          <div className="cb-skel" style={{ height: 12, width: '100%', borderRadius: 999 }} />
          <div className="cb-skel" style={{ height: 24, width: '26%', borderRadius: 8 }} />
          <div className="cb-skel" style={{ height: 12, width: '100%', borderRadius: 999 }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ ...card, flex: '1 1 260px', minHeight: 78, padding: '14px 18px', flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <div className="cb-skel" style={{ width: 40, height: 40, flex: '0 0 40px', borderRadius: 12 }} />
            <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="cb-skel" style={{ height: 10, width: '60%', borderRadius: 5 }} />
              <div className="cb-skel" style={{ height: 20, width: '40%', borderRadius: 7 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Sin consultas en el periodo elegido. Sugiere un periodo mas largo (si hay uno) en vez de
 * proponer el que ya esta elegido.
 */
export function EmptyState({ suggestion }: { suggestion: { hint: string; label: string; onSelect: () => void } | null }) {
  return (
    <div className="cb-empty" role="status">
      <span aria-hidden="true" className="cb-empty-ico">
        <Icon name="chat" size={30} stroke={1.8} />
      </span>
      <h2>Todavía no hay consultas en este período.</h2>
      <p>{suggestion ? suggestion.hint : 'Cuando tus clientes escriban, vas a verlas acá.'}</p>
      {suggestion && (
        <button type="button" className="cb-btn cb-primary cb-noprint" onClick={suggestion.onSelect}>
          {suggestion.label}
        </button>
      )}
    </div>
  );
}
