'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CommandAction {
  id: string
  label: string
  description?: string
  keywords?: string[]
  run: () => void
}

export function CommandPalette({
  open,
  onOpenChange,
  actions,
  title = 'Command Palette',
  placeholder = 'Search commands and records...',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  actions: CommandAction[]
  title?: string
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) {
      return actions.slice(0, 30)
    }

    return actions
      .filter((action) => {
        const haystack = [action.label, action.description ?? '', ...(action.keywords ?? [])]
          .join(' ')
          .toLowerCase()
        return haystack.includes(normalized)
      })
      .slice(0, 40)
  }, [actions, query])

  useEffect(() => {
    if (!open) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
    })

    return () => window.cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false)
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((index) => Math.min(index + 1, Math.max(0, filtered.length - 1)))
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((index) => Math.max(index - 1, 0))
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        const action = filtered[activeIndex]
        if (!action) {
          return
        }

        action.run()
        setQuery('')
        setActiveIndex(0)
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeIndex, filtered, onOpenChange, open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, open])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center bg-[rgba(20,11,7,0.58)] px-4 pt-[8vh]" onClick={() => onOpenChange(false)}>
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#3A2A1E] bg-[#1C1009] text-[#F5E8D4] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[#3A2A1E] px-4 py-3">
          <Search className="h-4 w-4 text-[#9A8070]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm text-[#F5E8D4] outline-none placeholder:text-[#7A6050]"
          />
          <span className="rounded border border-[#4A3020] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#9A8070]">
            esc
          </span>
        </div>

        <div className="border-b border-[#3A2A1E] px-4 py-2 text-xs uppercase tracking-[0.14em] text-[#9A8070]">{title}</div>

        <ul className="max-h-[56vh] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <li className="px-4 py-5 text-sm text-[#9A8070]">No matching commands.</li>
          ) : (
            filtered.map((action, index) => (
              <li key={action.id}>
                <button
                  onClick={() => {
                    action.run()
                    setQuery('')
                    setActiveIndex(0)
                    onOpenChange(false)
                  }}
                  className={cn(
                    'w-full px-4 py-2 text-left transition-colors',
                    index === activeIndex ? 'bg-[#2E1E12]' : 'hover:bg-[#251508]'
                  )}
                >
                  <p className="text-sm font-medium">{action.label}</p>
                  {action.description ? <p className="mt-0.5 text-xs text-[#9A8070]">{action.description}</p> : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
