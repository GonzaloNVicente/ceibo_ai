'use client';

import React, { useEffect, useRef, useState } from 'react';
import { formatCount } from '@/lib/format';
import type { TileModel } from '@/lib/dashboard-overview';
import { Icon } from './icons';

export type DataState = 'ok' | 'empty' | 'error';

interface TilesRowProps {
  title: string;
  tiles: TileModel[];
  state: DataState;
  /** "30 días" / "hoy": se muestra en la ficha del total */
  periodChip: string;
  segLabel: string;
}

/**
 * "Qué hizo Ceibo con cada consulta": seis fichas que suman el total de consultas.
 * Las fichas con desglose (resueltas y sin valor) abren un detalle al tocarlas.
 */
export function TilesRow({ title, tiles, state, periodChip, segLabel }: TilesRowProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Cierra el detalle con Escape o al hacer click afuera
  useEffect(() => {
    if (!openKey) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenKey(null);
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpenKey(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [openKey]);

  const parts = tiles.filter((t) => t.key !== 'total');

  return (
    <section aria-labelledby="cb-recorrido" className="cb-tiles-section">
      <div className="cb-sec">
        <h2 id="cb-recorrido">{title}</h2>
        <i aria-hidden="true" />
      </div>

      <div className="cb-tiles" ref={rootRef}>
        {tiles.map((t) => {
          const isInv = t.tone === 'inv';
          const n = state === 'error' ? '–' : state === 'empty' ? '0' : formatCount(t.n);
          const pct = isInv ? periodChip : state === 'ok' && t.pct !== null ? `${t.pct}%` : '–';
          const expandable = state === 'ok' && t.details.length > 0;
          const open = expandable && openKey === t.key;
          const popId = `cb-pop-${t.key}`;

          const content = (
            <>
              <span className="cb-tile-label">
                <span className="cb-chip" aria-hidden="true">
                  <Icon name={t.icon} size={14} stroke={2.3} />
                </span>
                {t.label}
              </span>
              <span className="cb-tile-row">
                <span className="cb-tile-num">{n}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span className="cb-tile-pct">{pct}</span>
                  {expandable && (
                    <span className={`cb-chev${open ? ' is-open' : ''}`} aria-hidden="true">
                      <Icon name="chevDown" size={12} stroke={3} />
                    </span>
                  )}
                </span>
              </span>
              {isInv ? (
                <span role="img" aria-label={state === 'ok' ? segLabel : 'Sin datos'} className="cb-segbar">
                  {state === 'ok' && t.n > 0 ? (
                    parts.map((p) => (
                      <span key={p.key} data-tone={p.tone} style={{ flex: `${p.n} 1 0` }} />
                    ))
                  ) : (
                    <span style={{ flex: '1 1 0', background: 'var(--fill)' }} />
                  )}
                </span>
              ) : (
                <span aria-hidden="true" className="cb-track">
                  <span style={{ width: `${state === 'ok' ? t.pct ?? 0 : 0}%` }} />
                </span>
              )}
            </>
          );

          return (
            <div key={t.key} className="cb-tile-wrap" data-tone={isInv ? undefined : t.tone}>
              {expandable ? (
                <button
                  type="button"
                  className={`cb-btn cb-tile cb-tile-btn${open ? ' is-open' : ''}`}
                  aria-expanded={open}
                  aria-controls={popId}
                  onClick={() => setOpenKey(open ? null : t.key)}
                >
                  {content}
                </button>
              ) : (
                <div className={`cb-tile${isInv ? ' is-inv' : ''}`}>{content}</div>
              )}

              {open && (
                <div id={popId} role="region" aria-label={t.popTitle ?? t.label} className="cb-pop">
                  <div className="cb-pop-head">
                    <span>{t.popTitle ?? t.label}</span>
                    <button type="button" className="cb-btn cb-pop-close" aria-label="Cerrar" onClick={() => setOpenKey(null)}>
                      <Icon name="close" size={12} stroke={3} />
                    </button>
                  </div>
                  {t.details.map((d) => (
                    <div key={d.label} className="cb-pop-item">
                      <div className="cb-pop-line">
                        <span>{d.label}</span>
                        <b>
                          {formatCount(d.n)} <em>· {d.pct}%</em>
                        </b>
                      </div>
                      <div aria-hidden="true" className="cb-pop-bar">
                        <div style={{ width: `${d.widthPct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
