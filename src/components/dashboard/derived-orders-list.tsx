import React from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatARS, formatRelativeTime, maskPhone, summarizeProduct } from '@/lib/format';
import type { ChatSession } from '@/lib/supabase/types';

interface DerivedOrdersListProps {
  title: string;
  ready: boolean;
  orders: ChatSession[];
  catalog: Record<string, string>;
  now: number;
  /** Cantidad maxima de filas visibles */
  limit?: number;
}

export function DerivedOrdersList({ title, ready, orders, catalog, now, limit = 4 }: DerivedOrdersListProps) {
  const visible = orders.slice(0, limit);

  return (
    <section
      aria-label={title}
      className="flex min-h-[380px] flex-col rounded-[20px] border border-border bg-card p-5 shadow-panel sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        <Link
          href="/inbox"
          className="rounded text-sm font-bold text-success underline underline-offset-4 hover:text-success/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Ver todos
        </Link>
      </div>

      {!ready || visible.length === 0 ? (
        <div className="grid flex-1 place-items-center py-8 text-center">
          <div>
            <div className="mx-auto grid size-12 place-items-center rounded-xl bg-secondary text-muted-foreground">
              <Package className="size-6" strokeWidth={1.6} aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">
              {ready ? 'No hay pedidos derivados en este período' : 'Cargando pedidos…'}
            </p>
            {ready && (
              <p className="mt-1 text-xs text-muted-foreground">
                Cuando un cliente confirme un pedido, lo vas a ver acá.
              </p>
            )}
          </div>
        </div>
      ) : (
        <ul className="mt-2 flex flex-1 flex-col divide-y divide-border">
          {visible.map((order) => {
            const assigned = Boolean(order.assigned_to);
            const amount = order.estimated_amount == null ? null : Number(order.estimated_amount);
            const product = summarizeProduct(order.related_product_id, catalog);

            return (
              <li key={order.id} className="flex flex-1 items-center gap-3 py-3">
                <div
                  className={cn(
                    'grid size-10 shrink-0 place-items-center rounded-xl',
                    assigned ? 'bg-success/10 text-success' : 'bg-negative/10 text-negative'
                  )}
                  aria-hidden="true"
                >
                  <Package className="size-5" strokeWidth={1.7} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground" title={order.related_product_id ?? undefined}>
                    {product}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground tabular-nums">
                    {order.customer_name ? `${order.customer_name} · ` : ''}
                    {maskPhone(order.customer_phone)} · {formatRelativeTime(order.last_message_at, now)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <p
                    className={cn(
                      'font-display text-[15px] font-bold tabular-nums',
                      amount != null && Number.isFinite(amount) ? 'text-success' : 'text-muted-foreground'
                    )}
                  >
                    {amount != null && Number.isFinite(amount) ? formatARS(amount) : 'Sin monto'}
                  </p>
                  <span
                    className={cn(
                      'rounded-md px-2 py-0.5 text-[11px] font-bold',
                      assigned ? 'bg-success/10 text-success' : 'bg-negative/10 text-negative'
                    )}
                  >
                    {assigned ? 'Con vendedor' : 'Sin asignar'}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
