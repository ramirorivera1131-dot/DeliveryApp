'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props { data: { date: string; revenue: number }[] }

export function RevenueChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} interval={4} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
        <Tooltip
          contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
          formatter={(v: number) => [`$${v.toFixed(2)}`, 'Ingresos']}
        />
        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  )
}
