'use client'
import { OrdersBoard } from '@/components/orders/OrdersBoard'
import { useRestaurant } from '@/hooks/use-restaurant'
import { Skeleton } from '@/components/ui/skeleton'

export default function OrdersPage() {
  const { data: restaurant, isLoading } = useRestaurant()

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-5 gap-4 h-[600px]">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!restaurant) return null

  return (
    <div className="flex flex-col h-full">
      <OrdersBoard restaurantId={restaurant.id} />
    </div>
  )
}
