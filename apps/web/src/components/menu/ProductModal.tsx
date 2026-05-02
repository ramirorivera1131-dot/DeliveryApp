'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ImagePlus, X } from 'lucide-react'
import Image from 'next/image'

type Category = { id: string; name: string }
type Product  = {
  id: string; name: string; description: string | null; price: number;
  image_url: string | null; is_available: boolean; category_id: string | null; sort_order: number
}

type Props = {
  isOpen: boolean
  onClose: () => void
  restaurantId: string
  categories: Category[]
  editing?: Product | null
  onSaved: (p: Product) => void
}

export function ProductModal({ isOpen, onClose, restaurantId, categories, editing, onSaved }: Props) {
  const [name, setName]               = useState(editing?.name ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [price, setPrice]             = useState(editing?.price?.toString() ?? '')
  const [categoryId, setCategoryId]   = useState(editing?.category_id ?? '')
  const [imageUrl, setImageUrl]       = useState<string | null>(editing?.image_url ?? null)
  const [imageFile, setImageFile]     = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(editing?.image_url ?? null)
  const [error, setError]             = useState('')
  const [saving, setSaving]           = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleClose = () => {
    setName(editing?.name ?? '')
    setDescription(editing?.description ?? '')
    setPrice(editing?.price?.toString() ?? '')
    setCategoryId(editing?.category_id ?? '')
    setImageUrl(editing?.image_url ?? null)
    setImageFile(null)
    setImagePreview(editing?.image_url ?? null)
    setError('')
    onClose()
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const uploadImage = async (file: File): Promise<string> => {
    const supabase = createClient()
    const ext  = file.name.split('.').pop()
    const path = `${restaurantId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('products').upload(path, file, { upsert: true })
    if (error) throw error
    const { data } = supabase.storage.from('products').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !price) return
    setError('')
    setSaving(true)
    try {
      const supabase = createClient()
      let finalImageUrl = imageUrl

      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile)
      }

      const payload = {
        name:        name.trim(),
        description: description.trim() || null,
        price:       parseFloat(price),
        category_id: categoryId || null,
        image_url:   finalImageUrl,
      }

      if (editing) {
        const { data, error: err } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editing.id)
          .select()
          .single()
        if (err) throw err
        onSaved(data as Product)
      } else {
        const { data, error: err } = await supabase
          .from('products')
          .insert({ ...payload, restaurant_id: restaurantId })
          .select()
          .single()
        if (err) throw err
        onSaved(data as Product)
      }
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={editing ? 'Editar producto' : 'Nuevo producto'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input
              label="Nombre del producto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Hamburguesa Clásica"
              required
            />
          </div>

          <div className="col-span-2">
            <Textarea
              label="Descripción (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ingredientes, información adicional…"
              rows={2}
            />
          </div>

          <Input
            label="Precio (USD)"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Categoría</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Image upload */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Foto del producto</p>
          {imagePreview ? (
            <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-200 group">
              <Image src={imagePreview} alt="Preview" fill className="object-cover" />
              <button
                type="button"
                onClick={() => { setImagePreview(null); setImageFile(null); setImageUrl(null) }}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} className="text-gray-600" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-colors text-gray-400 hover:text-orange-500"
            >
              <ImagePlus size={22} />
              <span className="text-xs mt-1">Subir foto</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" isLoading={saving}>
            {editing ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
