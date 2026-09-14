import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trendText?: string;
  trendPositive?: boolean;
  subtext?: string;
  iconColor?: string;
  iconBgColor?: string;
  valueColor?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  trendText,
  trendPositive = true,
  subtext,
  iconColor = 'text-brand-600',
  iconBgColor = 'bg-brand-50',
  valueColor = 'text-slate-900',
  className,
}: MetricCardProps) {
  return (
    <Card className={cn('hover:shadow-md transition-shadow border-slate-200', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        <div className={cn('p-2 rounded-lg', iconBgColor, iconColor)}>
          <Icon className="w-4 h-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold tracking-tight', valueColor)}>
          {value}
        </div>
        {trendText && (
          <div
            className={cn(
              'flex items-center gap-1.5 mt-1 text-xs font-medium',
              trendPositive ? 'text-brand-600' : 'text-slate-600'
            )}
          >
            {trendPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>{trendText}</span>
          </div>
        )}
        {subtext && (
          <p className="text-[11px] text-slate-400 mt-1">{subtext}</p>
        )}
      </CardContent>
    </Card>
  );
}
