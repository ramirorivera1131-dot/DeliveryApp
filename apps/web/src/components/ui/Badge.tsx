import { cn, getStatusConfig } from '@/lib/utils'

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const c = getStatusConfig(status)
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', c.bg, c.text, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />
      {c.label}
    </span>
  )
}
