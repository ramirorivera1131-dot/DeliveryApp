'use client'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, X } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { useUpsertProduct } from '@/hooks/use-menu'
import { productSchema, type ProductInput } from '@/lib/validations'
import type { Category, Product } from '@/lib/types'

type Props = {
  isOpen: boolean
  onClose: () => void
  restaurantId: string
  categories: Category[]
  editing?: Product | null
}

export function ProductModal({ isOpen, onClose, restaurantId, categories, editing }: Props) {
  const upsert   = useUpsertProduct(restaurantId)
  const fileRef  = useRef<HTMLInputElement>(null)
  const [imageFile,    setImageFile]    = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading,    setUploading]    = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', description: '', price: 0, category_id: null, is_available: true },
  })

  useEffect(() => {
    reset({
      name:         editing?.name          ?? '',
      description:  editing?.description   ?? '',
      price:        editing?.price         ?? 0,
      category_id:  editing?.category_id   ?? null,
      is_available: editing?.is_available  ?? true,
    })
    setImageFile(null)
    setImagePreview(editing?.image_url ?? null)
  }, [editing, isOpen, reset])

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

  const handleClose = () => {
    reset()
    setImageFile(null)
    setImagePreview(null)
    onClose()
  }

  const onSubmit = async (data: ProductInput) => {
    try {
      let image_url = editing?.image_url ?? null
      if (imageFile) {
        setUploading(true)
        image_url = await uploadImage(imageFile)
        setUploading(false)
      } else if (imagePreview === null) {
        image_url = null
      }
      await upsert.mutateAsync({
        ...(editing ? { id: editing.id } : {}),
        name:         data.name,
        description:  data.description ?? null,
        price:        data.price,
        category_id:  data.category_id || null,
        image_url,
        is_available: editing?.is_available ?? true,
      })
      toast.success(editing ? 'Producto actualizado' : 'Producto creado')
      handleClose()
    } catch {
      setUploading(false)
      toast.error('Error al guardar el producto')
    }
  }

  const loading = isSubmitting || uploading

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={editing ? 'Editar producto' : 'Nuevo producto'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input
              label="Nombre del producto"
              placeholder="Ej. Hamburguesa Clásica"
              required
              error={errors.name?.message}
              {...register('name')}
            />
          </div>

          <div className="col-span-2">
            <Textarea
              label="Descripción (opcional)"
              placeholder="Ingredientes, información adicional…"
              rows={2}
              error={errors.description?.message}
              {...register('description')}
            />
          </div>

          <Input
            label="Precio (USD)"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            required
            error={errors.price?.message}
            {...register('price')}
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Categoría</label>
            <select
              {...register('category_id')}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring text-foreground"
            >
              <option value="">Sin categoría</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Image upload */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2">Foto del producto</p>
          {imagePreview ? (
            <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-border group">
              <Image src={imagePreview} alt="Preview" fill className="object-cover" />
              <button
                type="button"
                onClick={() => { setImagePreview(null); setImageFile(null) }}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} className="text-foreground" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center w-32 h-32 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary"
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

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" loading={loading}>
            {editing ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
