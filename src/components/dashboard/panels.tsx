import React from 'react';
import Link from 'next/link';
import {
  averageText,
  type ChartModel,
  type MoneyModel,
  type TimeModel,
} from '@/lib/dashboard-overview';
import type { Granularity } from '@/lib/dashboard-range';
import { Icon, type IconName } from './icons';
import type { DataState } from './tiles-row';

// ---------------------------------------------------------------------------------------------
// Grafico de barras (horas por periodo / valor por periodo)
// ---------------------------------------------------------------------------------------------

interface ChartCardProps {
  id: string;
  title: string;
  tone: 'blue' | 'green';
  kind: 'hours' | 'money';
  chart: ChartModel;
  granularity: Granularity;
  state: DataState;
  /** Ancho (px) de la columna de etiquetas del eje Y */
  yWidth: number;
  flex: string;
}

function ChartCard({ id, title, tone, kind, chart, granularity, state, yWidth, flex }: ChartCardProps) {
  const err = state === 'error';
  return (
    <section aria-labelledby={id} className="cb-card chart" data-tone={tone} style={{ flex }}>
      <div className="cb-card-head">
        <div>
          <h2 id={id}>{title}</h2>
          <p className="sub">{chart.subtitle}</p>
        </div>
        {!err && chart.hasData && (
          <span className="cb-legend">
            <i aria-hidden="true" style={{ borderTop: '2px solid var(--tc)' }} />
            Promedio <strong>{averageText(kind, chart.average, granularity)}</strong>
          </span>
        )}
      </div>

      {err ? (
        <div className="cb-plot-empty">No pudimos cargar el gráfico. Vuelve apenas se recupere la conexión.</div>
      ) : !chart.hasData ? (
        <div className="cb-plot-empty">Todavía no hay datos para graficar en este período.</div>
      ) : (
        <div className="cb-plot-wrap">
          <div className="cb-plot">
            <div className="cb-plot-area">
              <div aria-hidden="true" className="cb-grid-dash" style={{ top: 0 }} />
              <div aria-hidden="true" className="cb-grid-dash" style={{ top: '50%' }} />
              <div aria-hidden="true" className="cb-grid-base" />
              <div role="img" aria-label={chart.ariaLabel} className="cb-bars">
                {chart.bars.map((b, i) => (
                  <div key={i} title={b.tip} className="cb-bar-slot">
                    <div
                      className="cb-bar"
                      style={{ height: `${b.heightPct}%`, background: tone === 'blue' ? 'var(--blue-bar)' : 'var(--green-bar)' }}
                    />
                  </div>
                ))}
              </div>
              <div aria-hidden="true" className="cb-avg-line" style={{ top: `${chart.averageTopPct}%` }} />
            </div>
            <div aria-hidden="true" className="cb-yaxis" style={{ width: yWidth }}>
              <span style={{ top: '0%' }}>{chart.yLabels.top}</span>
              <span style={{ top: '50%' }}>{chart.yLabels.mid}</span>
              <span style={{ top: '100%' }}>{chart.yLabels.bottom}</span>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="cb-xaxis"
            style={{ gridTemplateColumns: `repeat(${chart.bars.length}, minmax(0, 1fr))`, marginRight: yWidth + 10 }}
          >
            {chart.xLabels.map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------------------------
// Tarjeta de dato
// ---------------------------------------------------------------------------------------------

interface KpiProps {
  icon: IconName;
  tone: 'blue' | 'green';
  label: string;
  value: React.ReactNode;
  unit?: string;
  valueClass?: 'up' | 'down';
  red?: boolean;
  /** Anillo de progreso (0..1) en lugar del icono */
  ring?: number;
  ringLabel?: string;
}

const RING = 100.5; // 2 * pi * r (r = 16)

function Kpi({ icon, tone, label, value, unit, valueClass, red, ring, ringLabel }: KpiProps) {
  return (
    <div className={`cb-kpi${red ? ' is-red' : ''}`} data-tone={tone}>
      {ring !== undefined ? (
        <span role="img" aria-label={ringLabel} style={{ flex: '0 0 40px', width: 40, height: 40, display: 'inline-flex' }}>
          <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="16" fill="none" strokeWidth="6" style={{ stroke: 'var(--blue-tint)' }} />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(RING * ring).toFixed(1)} ${RING}`}
              transform="rotate(-90 20 20)"
              style={{ stroke: 'var(--blue)' }}
            />
          </svg>
        </span>
      ) : (
        <span aria-hidden="true" className="cb-kpi-ico">
          <Icon name={icon} size={20} stroke={red ? 2.2 : 2.1} />
        </span>
      )}
      <span className="cb-kpi-body">
        <span className="cb-kpi-label">{label}</span>
        <span className={`cb-kpi-val${valueClass ? ` ${valueClass}` : ''}`}>
          {value}
          {unit ? <small>{unit}</small> : null}
        </span>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Vista TIEMPO
// ---------------------------------------------------------------------------------------------

interface TimePanelProps {
  state: DataState;
  model: TimeModel;
  chart: ChartModel;
  granularity: Granularity;
  hidden: boolean;
  id: string;
  labelledBy: string;
}

export function TimePanel({ state, model, chart, granularity, hidden, id, labelledBy }: TimePanelProps) {
  const err = state === 'error';
  const D = '–';
  return (
    <div role="tabpanel" id={id} aria-labelledby={labelledBy} hidden={hidden} className="cb-panel">
      <div className="cb-row">
        <ChartCard
          id="cb-chart-t"
          title="Horas devueltas a tu equipo por día"
          tone="blue"
          kind="hours"
          chart={chart}
          granularity={granularity}
          state={state}
          yWidth={34}
          flex="7 1 520px"
        />
        <section aria-labelledby="cb-cmp" className="cb-card" style={{ flex: '5 1 340px', gap: 2 }}>
          <h2 id="cb-cmp">Sin Ceibo y con Ceibo</h2>
          <p className="sub" style={{ marginTop: 0 }}>Consultas que pasan por tu equipo</p>
          <div className="cb-cmp">
            <div className="cb-cmp-item">
              <div className="cb-cmp-top">
                <span className="cb-cmp-name">Sin Ceibo</span>
                <span className="cb-cmp-val">{err ? D : model.without}</span>
              </div>
              <div aria-hidden="true" className="cb-cmp-bar">
                <div style={{ width: err || model.without === D ? 0 : '100%' }} />
              </div>
              <p className="cb-cmp-note">de las consultas pasaba por tu equipo</p>
            </div>
            <div className="cb-cmp-item with">
              <div className="cb-cmp-top">
                <span className="cb-cmp-name">Con Ceibo</span>
                <span className="cb-cmp-val">{err ? D : model.withCeibo}</span>
              </div>
              <div aria-hidden="true" className="cb-cmp-bar">
                <div style={{ width: err ? 0 : `${Math.round(model.withFraction * 100)}%` }} />
              </div>
              <p className="cb-cmp-note">llega a tu equipo. El resto lo responde Ceibo.</p>
            </div>
          </div>
        </section>
      </div>

      <div className="cb-row">
        <Kpi
          icon="bolt"
          tone="blue"
          label="Responde en"
          value={err ? D : model.response.value}
          unit={err ? '' : model.response.unit}
        />
        <Kpi
          icon="check"
          tone="blue"
          label="Se resuelven sin intervención"
          value={err ? D : model.resolved.value}
          ring={err ? 0 : model.resolved.fraction}
          ringLabel={err ? 'Sin datos' : model.resolved.label}
        />
        <Kpi
          icon="users"
          tone="blue"
          label="Solo llegaron a tu equipo"
          value={err ? D : model.reach.value}
          unit={err ? '' : model.reach.unit}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Vista DINERO
// ---------------------------------------------------------------------------------------------

interface MoneyPanelProps {
  state: DataState;
  model: MoneyModel;
  chart: ChartModel;
  granularity: Granularity;
  hidden: boolean;
  id: string;
  labelledBy: string;
}

export function MoneyPanel({ state, model, chart, granularity, hidden, id, labelledBy }: MoneyPanelProps) {
  const err = state === 'error';
  const D = '–';
  const sp = model.split;
  const hasValue = sp.withSeller.flex + sp.unassigned.flex > 0;
  return (
    <div role="tabpanel" id={id} aria-labelledby={labelledBy} hidden={hidden} className="cb-panel">
      <div className="cb-row">
        <ChartCard
          id="cb-chart-d"
          title="Valor de pedidos y presupuestos"
          tone="green"
          kind="money"
          chart={chart}
          granularity={granularity}
          state={state}
          yWidth={56}
          flex="1 1 460px"
        />
        <section aria-labelledby="cb-ventas" className="cb-card" data-tone="green" style={{ flex: '1 1 460px', gap: 14 }}>
          <div>
            <h2 id="cb-ventas">{err ? 'Posibles ventas derivadas' : sp.title}</h2>
            <p className="sub">{err ? D : sp.subtitle}</p>
          </div>
          {err ? (
            <div className="cb-plot-empty" style={{ flex: '1 1 auto', minHeight: 148 }}>
              El detalle de las ventas aparece apenas vuelva la conexión.
            </div>
          ) : (
            <>
              <div role="img" aria-label={sp.ariaLabel} className="cb-split-bar">
                {hasValue ? (
                  <>
                    <span style={{ flex: `${sp.withSeller.flex} 1 0`, background: 'var(--green)' }} />
                    <span style={{ flex: `${sp.unassigned.flex} 1 0`, background: 'var(--red)' }} />
                  </>
                ) : (
                  <span style={{ flex: '1 1 0', background: 'var(--fill)' }} />
                )}
              </div>
              <div className="cb-split-boxes">
                <div className="cb-split-box ok">
                  <span className="cb-split-name">
                    <Icon name="check" size={14} stroke={2.8} />
                    Con vendedor asignado
                  </span>
                  <span className="cb-split-n">
                    {sp.withSeller.n}
                    <small>{sp.withSeller.n === 1 ? 'venta' : 'ventas'}</small>
                  </span>
                  <span className="cb-split-val">
                    {sp.withSeller.valor} <span>· {sp.withSeller.pct}% del valor</span>
                  </span>
                </div>
                <div className="cb-split-box bad">
                  <span className="cb-split-name">
                    <Icon name="alert" size={14} stroke={2.4} />
                    Sin asignar
                  </span>
                  <span className="cb-split-n">
                    {sp.unassigned.n}
                    <small>{sp.unassigned.n === 1 ? 'venta' : 'ventas'}</small>
                  </span>
                  <span className="cb-split-val">
                    {sp.unassigned.valor} <span>· {sp.unassigned.pct}% del valor</span>
                  </span>
                  {sp.unassigned.n > 0 && (
                    <Link href="/inbox" className="cb-link cb-split-link">
                      Asignar vendedor <Icon name="chevRight" size={13} stroke={2.6} />
                    </Link>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <div className="cb-row">
        <Kpi
          icon="cart"
          tone="green"
          label="Pedido promedio"
          value={err ? D : model.avgTicket ? model.avgTicket.num : D}
          unit={err || !model.avgTicket ? '' : model.avgTicket.unit}
        />
        <Kpi
          icon="trendUp"
          tone="green"
          label="Pedidos nuevos vs. período anterior"
          value={err ? D : model.newOrders ? `${model.newOrders.dir === 'up' ? '▲' : '▼'} ${model.newOrders.pct}%` : D}
          valueClass={err || !model.newOrders ? undefined : model.newOrders.dir}
        />
        <Kpi
          icon="userAlert"
          tone="green"
          red
          label="Esperando a un vendedor"
          value={err ? D : model.waiting.num}
          unit={err ? '' : model.waiting.unit ? `${model.waiting.unit} · ${model.waiting.count} sin asignar` : `· ${model.waiting.count} sin asignar`}
        />
      </div>
    </div>
  );
}
