import React from 'react';
import Link from 'next/link';
import { ArrowRight, Inbox } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatARS, formatCount } from '@/lib/format';

interface PedidosCardProps {
  ready: boolean;
  total: number;
  unassigned: number;
  withSeller: number;
  estimatedValue: number;
  reclamos: number;
}

export function PedidosCard({ ready, total, unassigned, withSeller, estimatedValue, reclamos }: PedidosCardProps) {
  return (
    <section
      aria-label="Pedidos y presupuestos derivados"
      className="flex min-h-[256px] flex-col justify-between gap-5 rounded-[20px] border border-border bg-card p-6 shadow-panel sm:flex-row sm:p-7"
    >
      <div className="flex min-w-0 flex-col justify-between">
        <p className="flex items-start gap-2 text-sm font-semibold text-muted-foreground">
          <Inbox className="mt-0.5 size-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
          Pedidos y presupuestos derivados a vendedores
        </p>

        <div>
          <p className="flex flex-wrap items-baseline gap-x-3 font-display font-bold leading-none tabular-nums">
            <span className="text-[72px] text-success sm:text-[88px] xl:text-[104px]">
              {ready ? formatCount(total) : '–'}
            </span>
            <span className="text-2xl font-semibold text-foreground sm:text-[28px]">
              {total === 1 ? 'listo para cerrar' : 'listos para cerrar'}
            </span>
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Valor estimado{' '}
            <span className="font-bold tabular-nums text-success">{ready ? formatARS(estimatedValue) : '–'}</span>
            {' · '}
            <span className={cn('font-bold tabular-nums', ready && (reclamos > 0 ? 'text-negative' : 'text-success'))}>
              {ready ? formatCount(reclamos) : '–'} {reclamos === 1 ? 'reclamo' : 'reclamos'}
            </span>
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-col justify-between gap-4 sm:w-[210px]">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-negative/10 px-3.5 py-2.5 text-sm font-semibold text-negative">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-negative" aria-hidden="true" />
              Sin asignar
            </span>
            <span className="font-display text-lg tabular-nums">{ready ? unassigned : '–'}</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-success/10 px-3.5 py-2.5 text-sm font-semibold text-success">
            <span className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-success" aria-hidden="true" />
              Con un vendedor
            </span>
            <span className="font-display text-lg tabular-nums">{ready ? withSeller : '–'}</span>
          </div>
        </div>

        <Link
          href="/inbox"
          className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-center font-bold')}
        >
          Ver pedidos
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
