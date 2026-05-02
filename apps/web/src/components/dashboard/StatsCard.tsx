import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

type Props = {
  title: string
  value: string
  sub?: string
  icon: LucideIcon
  color: 'orange' | 'green' | 'yellow' | 'blue' | 'purple'
  pulse?: boolean
}

const palette = {
  orange: { wrap: 'bg-orange-50',  icon: 'bg-orange-500',  val: 'text-orange-600' },
  green:  { wrap: 'bg-green-50',   icon: 'bg-green-500',   val: 'text-green-600'  },
  yellow: { wrap: 'bg-yellow-50',  icon: 'bg-yellow-500',  val: 'text-yellow-600' },
  blue:   { wrap: 'bg-blue-50',    icon: 'bg-blue-500',    val: 'text-blue-600'   },
  purple: { wrap: 'bg-purple-50',  icon: 'bg-purple-500',  val: 'text-purple-600' },
}

export function StatsCard({ title, value, sub, icon: Icon, color, pulse }: Props) {
  const c = palette[color]
  return (
    <div className={cn('relative rounded-2xl p-6', c.wrap)}>
      {pulse && (
        <span className="absolute top-4 right-4 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-yellow-500" />
        </span>
      )}
      <div className={cn('inline-flex h-10 w-10 items-center justify-center rounded-xl text-white mb-4', c.icon)}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className={cn('mt-0.5 text-2xl font-bold', c.val)}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}
