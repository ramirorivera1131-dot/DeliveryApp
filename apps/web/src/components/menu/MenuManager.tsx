'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CategoryModal } from './CategoryModal'
import { ProductModal } from './ProductModal'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Tag, Package } from 'lucide-react'
import Image from 'next/image'

type Category = { id: string; name: string; description: string | null; sort_order: number; is_active: boolean }
type Product  = { id: string; name: string; description: string | null; price: number; image_url: string | null; is_available: boolean; category_id: string | null; sort_order: number }
type Props    = { restaurantId: string; initialCategories: Category[]; initialProducts: Product[] }

export function MenuManager({ restaurantId, initialCategories, initialProducts }: Props) {
  const [categories,   setCategories]   = useState<Category[]>(initialCategories)
  const [products,     setProducts]     = useState<Product[]>(initialProducts)
  const [activeTab,    setActiveTab]    = useState<'categories' | 'products'>('products')
  const [selectedCat,  setSelectedCat]  = useState<string | 'all'>('all')
  const [catModal,     setCatModal]     = useState(false)
  const [prodModal,    setProdModal]    = useState(false)
  const [editingCat,   setEditingCat]   = useState<Category | null>(null)
  const [editingProd,  setEditingProd]  = useState<Product | null>(null)

  const supabase = createClient()

  // Category CRUD
  const handleCategorySaved = (cat: Category) => {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === cat.id)
      return idx >= 0 ? prev.with(idx, cat) : [...prev, cat]
    })
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría? Los productos quedarán sin categoría.')) return
    await supabase.from('categories').delete().eq('id', id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  // Product CRUD
  const handleProductSaved = (p: Product) => {
    setProducts((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id)
      return idx >= 0 ? prev.with(idx, p) : [...prev, p]
    })
  }

  const handleToggleAvailable = async (product: Product) => {
    const { data } = await supabase
      .from('products')
      .update({ is_available: !product.is_available })
      .eq('id', product.id)
      .select()
      .single()
    if (data) handleProductSaved(data as Product)
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return
    await supabase.from('products').delete().eq('id', id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  const filteredProducts = selectedCat === 'all'
    ? products
    : products.filter((p) => p.category_id === selectedCat)

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menú</h1>
          <p className="text-sm text-gray-400 mt-0.5">{categories.length} categorías · {products.length} productos</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { setEditingCat(null); setCatModal(true) }}
          >
            <Tag size={14} /> Nueva categoría
          </Button>
          <Button
            size="sm"
            onClick={() => { setEditingProd(null); setProdModal(true) }}
          >
            <Plus size={14} /> Nuevo producto
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {(['products', 'categories'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'products' ? <Package size={14} /> : <Tag size={14} />}
            {tab === 'products' ? 'Productos' : 'Categorías'}
          </button>
        ))}
      </div>

      {/* Products view */}
      {activeTab === 'products' && (
        <div className="flex gap-6">
          {/* Category filter sidebar */}
          <div className="w-44 shrink-0">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Categorías</p>
            <button
              onClick={() => setSelectedCat('all')}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors mb-0.5 ${selectedCat === 'all' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Todos ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.category_id === cat.id).length
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors mb-0.5 ${selectedCat === cat.id ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {cat.name} ({count})
                </button>
              )
            })}
          </div>

          {/* Products grid */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 rounded-2xl border-2 border-dashed border-gray-200">
                <Package size={32} className="text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Sin productos en esta categoría</p>
                <Button size="sm" className="mt-3" onClick={() => { setEditingProd(null); setProdModal(true) }}>
                  <Plus size={13} /> Agregar producto
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className={`rounded-2xl bg-white border overflow-hidden transition-opacity ${!product.is_available ? 'opacity-60' : ''}`}>
                    {/* Image */}
                    <div className="relative h-36 bg-gray-100">
                      {product.image_url ? (
                        <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package size={28} className="text-gray-300" />
                        </div>
                      )}
                      {!product.is_available && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <span className="text-xs font-semibold text-gray-500 bg-white px-2 py-1 rounded-full border">No disponible</span>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-4">
                      <p className="font-semibold text-gray-900 text-sm">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{product.description}</p>
                      )}
                      <p className="mt-2 text-base font-bold text-orange-600">{formatCurrency(product.price)}</p>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 px-4 pb-4">
                      <button
                        onClick={() => handleToggleAvailable(product)}
                        title={product.is_available ? 'Desactivar' : 'Activar'}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-600 transition-colors"
                      >
                        {product.is_available
                          ? <ToggleRight size={18} className="text-green-500" />
                          : <ToggleLeft  size={18} className="text-gray-400"  />}
                      </button>
                      <button
                        onClick={() => { setEditingProd(product); setProdModal(true) }}
                        className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Categories view */}
      {activeTab === 'categories' && (
        <div className="space-y-2 max-w-2xl">
          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 rounded-2xl border-2 border-dashed border-gray-200">
              <Tag size={32} className="text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">Sin categorías creadas</p>
              <Button size="sm" className="mt-3" onClick={() => { setEditingCat(null); setCatModal(true) }}>
                <Plus size={13} /> Nueva categoría
              </Button>
            </div>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-4 rounded-xl bg-white border border-gray-100 px-5 py-4">
                <div className="h-9 w-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                  <Tag size={15} className="text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{cat.name}</p>
                  {cat.description && <p className="text-xs text-gray-400 truncate">{cat.description}</p>}
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {products.filter((p) => p.category_id === cat.id).length} productos
                </span>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => { setEditingCat(cat); setCatModal(true) }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
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
        onSaved={handleCategorySaved}
      />
      <ProductModal
        isOpen={prodModal}
        onClose={() => { setProdModal(false); setEditingProd(null) }}
        restaurantId={restaurantId}
        categories={categories}
        editing={editingProd}
        onSaved={handleProductSaved}
      />
    </div>
  )
}
