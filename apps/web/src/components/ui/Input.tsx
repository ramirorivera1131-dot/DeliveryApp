import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

type InputProps = {
  label?: string
  error?: string
  hint?: string
} & React.InputHTMLAttributes<HTMLInputElement>

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}{props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white',
            'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
            'placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500',
            error && 'border-red-400 focus:ring-red-500',
            className,
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'

type TextareaProps = {
  label?: string
  error?: string
  hint?: string
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, rows = 3, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={cn(
            'w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white resize-none',
            'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
            'placeholder:text-gray-400',
            error && 'border-red-400 focus:ring-red-500',
            className,
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'

export { Input, Textarea }
