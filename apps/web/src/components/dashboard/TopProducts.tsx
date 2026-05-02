import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { Package } from 'lucide-react'

type TopProduct = { name: string; count: number; revenue: number }

export function TopProducts({ products }: { products: TopProduct[] }) {
  const max = products[0]?.count ?? 1
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 productos del mes</CardTitle>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
            <Package size={28} className="opacity-30" />
            <p className="text-sm">Sin datos este mes</p>
          </div>
        ) : (
          <ol className="space-y-3">
            {products.map((p, i) => (
              <li key={p.name} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold bg-primary/10 text-primary">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground truncate pr-4">{p.name}</p>
                    <p className="text-xs text-muted-foreground shrink-0">{p.count} uds.</p>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(p.count / max) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-foreground shrink-0">
                  {formatCurrency(p.revenue)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
