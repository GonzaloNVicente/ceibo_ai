'use client';

import React, { useRef } from 'react';
import type { MoneyModel, TimeModel } from '@/lib/dashboard-overview';
import { Icon } from './icons';
import type { DataState } from './tiles-row';

export type DashTab = 'tiempo' | 'dinero';

interface FocusTabsProps {
  tab: DashTab;
  onTab: (tab: DashTab) => void;
  loading: boolean;
  state: DataState;
  time: TimeModel;
  money: MoneyModel;
}

const TAB_IDS: Record<DashTab, string> = { tiempo: 'cb-tab-tiempo', dinero: 'cb-tab-dinero' };
export const PANEL_IDS: Record<DashTab, string> = { tiempo: 'cb-panel-tiempo', dinero: 'cb-panel-dinero' };

/**
 * Las dos tarjetas grandes son las pestañas: los dos numeros clave se ven siempre y al tocar
 * una cambia todo el detalle de abajo. Teclado: flechas, Inicio y Fin (patron WAI-ARIA tabs).
 */
export function FocusTabs({ tab, onTab, loading, state, time, money }: FocusTabsProps) {
  const refs = { tiempo: useRef<HTMLButtonElement>(null), dinero: useRef<HTMLButtonElement>(null) };
  const isT = tab === 'tiempo';

  const move = (next: DashTab) => {
    onTab(next);
    refs[next].current?.focus();
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      move(isT ? 'dinero' : 'tiempo');
    } else if (e.key === 'Home') {
      e.preventDefault();
      move('tiempo');
    } else if (e.key === 'End') {
      e.preventDefault();
      move('dinero');
    }
  };

  const err = state === 'error';
  const heroT = err ? { value: '–', unit: '' } : time.hero;
  const equiv = err ? ' · equivale a – jornadas' : state === 'empty' ? '' : time.equivalence;
  const heroD = err ? { num: '–', unit: '' } : money.hero;
  const sinAsignar = state === 'ok' ? money.waiting.count : 0;

  return (
    <>
      <div className="cb-sec is-gap">
        <span className="t" id="cb-elegi">Elegí qué querés ver</span>
        <i aria-hidden="true" />
      </div>
      <div role="tablist" aria-labelledby="cb-elegi" className="cb-tabs">
        <button
          ref={refs.tiempo}
          type="button"
          role="tab"
          id={TAB_IDS.tiempo}
          className="cb-tab"
          data-tone="blue"
          aria-selected={isT}
          aria-controls={PANEL_IDS.tiempo}
          tabIndex={isT ? 0 : -1}
          onClick={() => onTab('tiempo')}
          onKeyDown={onKeyDown}
        >
          <span className="cb-tab-head">
            <span className="cb-tab-title">
              <span className="cb-badge blue" aria-hidden="true">
                <Icon name="clock" size={17} stroke={2.3} />
              </span>
              Tiempo
            </span>
            <span className="cb-radio" aria-hidden="true">
              {isT && <Icon name="check" size={13} stroke={3.4} />}
            </span>
          </span>

          {loading ? (
            <span aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span className="cb-skel" style={{ display: 'block', width: 130, height: 56, borderRadius: 12 }} />
              <span className="cb-skel" style={{ display: 'block', width: 300, maxWidth: '100%', height: 14, borderRadius: 7 }} />
            </span>
          ) : (
            <span className="cb-tab-body">
              <span className="cb-hero">
                <span className="cb-hero-num">{heroT.value}</span>
                <span className="cb-hero-unit">{heroT.unit}</span>
              </span>
              <span className="cb-hero-cap">
                <b>devueltas a tu equipo</b>
                {equiv}
              </span>
            </span>
          )}

          <span className="cb-tab-foot">
            {state === 'ok' && time.compare ? (
              <span className={`cb-compare ${time.compare.dir}`}>
                {time.compare.dir === 'up' ? '▲' : '▼'} {time.compare.pct}%<span> vs. período anterior</span>
              </span>
            ) : (
              <span />
            )}
            {isT ? (
              <span className="cb-open">
                Mostrando el detalle <Icon name="chevDown" size={14} stroke={2.4} />
              </span>
            ) : (
              <span className="cb-open pill">
                Ver detalle <Icon name="chevRight" size={14} stroke={2.4} />
              </span>
            )}
          </span>
        </button>

        <button
          ref={refs.dinero}
          type="button"
          role="tab"
          id={TAB_IDS.dinero}
          className="cb-tab"
          data-tone="green"
          aria-selected={!isT}
          aria-controls={PANEL_IDS.dinero}
          tabIndex={!isT ? 0 : -1}
          onClick={() => onTab('dinero')}
          onKeyDown={onKeyDown}
        >
          <span className="cb-tab-head">
            <span className="cb-tab-title">
              <span className="cb-badge green" aria-hidden="true">
                <Icon name="coin" size={17} stroke={2.3} />
              </span>
              Dinero
            </span>
            <span className="cb-radio" aria-hidden="true">
              {!isT && <Icon name="check" size={13} stroke={3.4} />}
            </span>
          </span>

          {loading ? (
            <span aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span className="cb-skel" style={{ display: 'block', width: 160, height: 56, borderRadius: 12 }} />
              <span className="cb-skel" style={{ display: 'block', width: 280, maxWidth: '100%', height: 14, borderRadius: 7 }} />
            </span>
          ) : (
            <span className="cb-tab-body">
              <span className="cb-hero">
                <span className="cb-hero-num">{heroD.num}</span>
                <span className="cb-hero-unit">{heroD.unit}</span>
              </span>
              <span className="cb-hero-cap">
                <b>derivados a ventas</b>
              </span>
            </span>
          )}

          <span className="cb-tab-foot">
            {sinAsignar > 0 ? (
              <span className="cb-alert-dot">
                <i aria-hidden="true" />
                {sinAsignar} {sinAsignar === 1 ? 'pedido sin asignar' : 'pedidos sin asignar'}
              </span>
            ) : (
              <span />
            )}
            {!isT ? (
              <span className="cb-open">
                Mostrando el detalle <Icon name="chevDown" size={14} stroke={2.4} />
              </span>
            ) : (
              <span className="cb-open pill">
                Ver detalle <Icon name="chevRight" size={14} stroke={2.4} />
              </span>
            )}
          </span>
        </button>
      </div>
    </>
  );
}
