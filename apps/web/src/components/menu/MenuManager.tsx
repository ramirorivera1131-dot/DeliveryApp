'use client'
import { useState } from 'react'
import {
  Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Tag, Package, Copy, Search, AlertCircle,
} from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ConfirmModal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, cn } from '@/lib/utils'
import {
  useCategories, useProducts, useToggleProductAvailability,
  useDeleteProduct, useDeleteCategory, useUpsertProduct,
} from '@/hooks/use-menu'
import { CategoryModal } from './CategoryModal'
import { ProductModal } from './ProductModal'
import type { Category, Product } from '@/lib/types'

type Props = { restaurantId: string }

export function MenuManager({ restaurantId }: Props) {
  const { data: categories = [], isLoading: loadingCats } = useCategories(restaurantId)
  const { data: products   = [], isLoading: loadingProds } = useProducts(restaurantId)
  const toggleAvail   = useToggleProductAvailability(restaurantId)
  const deleteProduct = useDeleteProduct(restaurantId)
  const deleteCategory = useDeleteCategory(restaurantId)
  const duplicateProduct = useUpsertProduct(restaurantId)

  const [activeTab,    setActiveTab]    = useState<'products' | 'categories'>('products')
  const [selectedCat,  setSelectedCat]  = useState<string | 'all'>('all')
  const [search,       setSearch]       = useState('')
  const [catModal,     setCatModal]     = useState(false)
  const [prodModal,    setProdModal]    = useState(false)
  const [editingCat,   setEditingCat]   = useState<Category | null>(null)
  const [editingProd,  setEditingProd]  = useState<Product | null>(null)
  const [deleteCat,    setDeleteCat]    = useState<Category | null>(null)
  const [deleteProd,   setDeleteProd]   = useState<Product | null>(null)

  const loading = loadingCats || loadingProds

  const filteredProducts = products
    .filter(p => selectedCat === 'all' || p.category_id === selectedCat)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))

  const unavailableCount = products.filter(p => !p.is_available).length

  const handleDuplicate = async (product: Product) => {
    await duplicateProduct.mutateAsync({
      name:        `${product.name} (copia)`,
      description: product.description,
      price:       product.price,
      category_id: product.category_id,
      image_url:   product.image_url,
      is_available: false,
    })
    toast.success('Producto duplicado')
  }

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Menú</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {categories.length} categorías · {products.length} productos
            {unavailableCount > 0 && (
              <span className="ml-2 text-destructive font-medium">· {unavailableCount} no disponibles</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setEditingCat(null); setCatModal(true) }}
            leftIcon={<Tag size={14} />}>
            Categoría
          </Button>
          <Button size="sm" onClick={() => { setEditingProd(null); setProdModal(true) }}
            leftIcon={<Plus size={14} />}>
            Nuevo producto
          </Button>
        </div>
      </div>

      {unavailableCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle size={14} />
          <span>{unavailableCount} producto{unavailableCount > 1 ? 's' : ''} marcado{unavailableCount > 1 ? 's' : ''} como no disponible{unavailableCount > 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary p-1 rounded-lg w-fit">
        {(['products', 'categories'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              activeTab === tab
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab === 'products' ? <Package size={14} /> : <Tag size={14} />}
            {tab === 'products' ? 'Productos' : 'Categorías'}
          </button>
        ))}
      </div>

      {/* Products view */}
      {activeTab === 'products' && (
        <div className="flex gap-5">
          {/* Category filter */}
          <div className="w-44 shrink-0 space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
              Categorías
            </p>
            <CategoryFilterBtn
              label={`Todos (${products.length})`}
              active={selectedCat === 'all'}
              onClick={() => setSelectedCat('all')}
            />
            {categories.map(cat => (
              <CategoryFilterBtn
                key={cat.id}
                label={`${cat.name} (${products.filter(p => p.category_id === cat.id).length})`}
                active={selectedCat === cat.id}
                onClick={() => setSelectedCat(cat.id)}
                inactive={!cat.is_active}
              />
            ))}
          </div>

          {/* Products grid */}
          <div className="flex-1 min-w-0">
            <div className="mb-4">
              <Input
                placeholder="Buscar producto…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                leftElement={<Search size={14} />}
              />
            </div>
            {loading ? (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-60 rounded-xl" />)}
              </div>
            ) : filteredProducts.length === 0 ? (
              <EmptyState
                icon={<Package size={32} className="text-muted-foreground/30" />}
                message={search ? 'Sin resultados para esta búsqueda' : 'Sin productos en esta categoría'}
                action={!search ? (
                  <Button size="sm" onClick={() => { setEditingProd(null); setProdModal(true) }} leftIcon={<Plus size={13} />}>
                    Agregar producto
                  </Button>
                ) : undefined}
              />
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    category={categories.find(c => c.id === product.category_id)}
                    onEdit={() => { setEditingProd(product); setProdModal(true) }}
                    onDelete={() => setDeleteProd(product)}
                    onDuplicate={() => handleDuplicate(product)}
                    onToggle={() => {
                      toggleAvail.mutate(
                        { productId: product.id, isAvailable: !product.is_available },
                        { onSuccess: () => toast.success(product.is_available ? 'Producto desactivado' : 'Producto activado') }
                      )
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Categories view */}
      {activeTab === 'categories' && (
        <div className="max-w-2xl space-y-2">
          {loading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
          ) : categories.length === 0 ? (
            <EmptyState
              icon={<Tag size={32} className="text-muted-foreground/30" />}
              message="Sin categorías creadas"
              action={(
                <Button size="sm" onClick={() => { setEditingCat(null); setCatModal(true) }} leftIcon={<Plus size={13} />}>
                  Nueva categoría
                </Button>
              )}
            />
          ) : (
            categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Tag size={15} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground text-sm">{cat.name}</p>
                    {!cat.is_active && <Badge variant="warning">Inactiva</Badge>}
                  </div>
                  {cat.description && (
                    <p className="text-xs text-muted-foreground truncate">{cat.description}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {products.filter(p => p.category_id === cat.id).length} productos
                </span>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => { setEditingCat(cat); setCatModal(true) }}
                    className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteCat(cat)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      <CategoryModal
        isOpen={catModal}
        onClose={() => { setCatModal(false); setEditingCat(null) }}
        restaurantId={restaurantId}
        editing={editingCat}
      />
      <ProductModal
        isOpen={prodModal}
        onClose={() => { setProdModal(false); setEditingProd(null) }}
        restaurantId={restaurantId}
        categories={categories}
        editing={editingProd}
      />
      <ConfirmModal
        isOpen={!!deleteProd}
        onClose={() => setDeleteProd(null)}
        title="Eliminar producto"
        description={`¿Eliminar "${deleteProd?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        onConfirm={() => {
          if (!deleteProd) return
          deleteProduct.mutate(deleteProd.id, {
            onSuccess: () => { toast.success('Producto eliminado'); setDeleteProd(null) },
            onError:   () => toast.error('Error al eliminar'),
          })
        }}
      />
      <ConfirmModal
        isOpen={!!deleteCat}
        onClose={() => setDeleteCat(null)}
        title="Eliminar categoría"
        description={`¿Eliminar "${deleteCat?.name}"? Los productos quedarán sin categoría.`}
        confirmLabel="Eliminar"
        danger
        onConfirm={() => {
          if (!deleteCat) return
          deleteCategory.mutate(deleteCat.id, {
            onSuccess: () => { toast.success('Categoría eliminada'); setDeleteCat(null) },
            onError:   () => toast.error('Error al eliminar'),
          })
        }}
      />
    </div>
  )
}

function CategoryFilterBtn({ label, active, onClick, inactive }: { label: string; active: boolean; onClick: () => void; inactive?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        inactive && 'opacity-60',
      )}
    >
      {label}
    </button>
  )
}

function ProductCard({
  product, category, onEdit, onDelete, onDuplicate, onToggle,
}: {
  product: Product
  category?: Category
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onToggle: () => void
}) {
  return (
    <div className={cn(
      'rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-md',
      !product.is_available && 'opacity-60',
    )}>
      {/* Image */}
      <div className="relative h-36 bg-secondary">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package size={28} className="text-muted-foreground/30" />
          </div>
        )}
        {category && (
          <span className="absolute top-2 left-2 text-[10px] font-medium bg-card/90 backdrop-blur-sm px-2 py-0.5 rounded-full border border-border text-foreground">
            {category.name}
          </span>
        )}
        {!product.is_available && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <span className="text-xs font-semibold bg-background border border-border px-2 py-1 rounded-full text-muted-foreground">
              No disponible
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5">
        <p className="font-semibold text-foreground text-sm">{product.name}</p>
        {product.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{product.description}</p>
        )}
        <p className="mt-2 text-base font-bold text-primary">{formatCurrency(product.price)}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-3.5 pb-3.5 pt-0 border-t border-border">
        <button
          onClick={onToggle}
          title={product.is_available ? 'Desactivar' : 'Activar'}
          className="flex items-center gap-1 text-xs transition-colors"
        >
          {product.is_available
            ? <ToggleRight size={20} className="text-green-500" />
            : <ToggleLeft  size={20} className="text-muted-foreground" />
          }
        </button>
        <button
          onClick={onDuplicate}
          title="Duplicar"
          className="ml-1 p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <Copy size={13} />
        </button>
        <button
          onClick={onEdit}
          className="ml-auto p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function EmptyState({ icon, message, action }: { icon: React.ReactNode; message: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-border gap-3">
      {icon}
      <p className="text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  )
}
