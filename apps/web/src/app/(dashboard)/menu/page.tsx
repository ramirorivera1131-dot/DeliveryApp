import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyRestaurant, getCategories, getProducts } from '@/lib/supabase/queries'
import { MenuManager } from '@/components/menu/MenuManager'

export default async function MenuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const restaurant = await getMyRestaurant()
  if (!restaurant) redirect('/dashboard')

  const [categories, products] = await Promise.all([
    getCategories(restaurant.id),
    getProducts(restaurant.id),
  ])

  return (
    <MenuManager
      restaurantId={restaurant.id}
      initialCategories={categories}
      initialProducts={products}
    />
  )
}
