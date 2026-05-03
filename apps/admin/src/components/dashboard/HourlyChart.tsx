'use client'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { HourlyData } from '@/lib/types'

interface Props { data: HourlyData[] }

export function HourlyChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#f97316" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="hour" tick={{ fontSize: 11 }} className="text-muted-foreground" />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} className="text-muted-foreground" />
        <Tooltip
          contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
          labelStyle={{ fontWeight: 600 }}
          formatter={(v: number) => [v, 'Pedidos']}
        />
        <Area
          type="monotone"
          dataKey="orders"
          stroke="#f97316"
          strokeWidth={2}
          fill="url(#colorOrders)"
          dot={false}
          activeDot={{ r: 4, fill: '#f97316' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
