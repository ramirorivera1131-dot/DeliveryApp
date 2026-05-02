'use client'
import { MenuManager } from '@/components/menu/MenuManager'
import { useRestaurant } from '@/hooks/use-restaurant'
import { Skeleton } from '@/components/ui/skeleton'

export default function MenuPage() {
  const { data: restaurant, isLoading } = useRestaurant()

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-5">
          <Skeleton className="h-64 w-44 rounded-xl shrink-0" />
          <div className="flex-1 grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-60 rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!restaurant) return null

  return <MenuManager restaurantId={restaurant.id} />
}
