'use client'

import { useMemo, useState } from 'react'
import { Check, Plus, ShoppingBasket, Trash2 } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import type { ShoppingCategory } from '@/lib/workspace'

const CATEGORY_LABEL: Record<ShoppingCategory, string> = {
  groceries: 'Groceries',
  household: 'Household',
  pharmacy: 'Pharmacy',
  other: 'Other',
}

export default function SharedShoppingPage() {
  const { data, createShoppingItem, updateShoppingItem, deleteShoppingItem } = useWorkspace()

  const [title, setTitle] = useState('')
  const [quantity, setQuantity] = useState('')
  const [category, setCategory] = useState<ShoppingCategory>('groceries')
  const [createdBy, setCreatedBy] = useState('David')

  const items = useMemo(() => {
    return [...data.shoppingItems].sort((left, right) => {
      if (left.checked !== right.checked) {
        return left.checked ? 1 : -1
      }
      return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
    })
  }, [data.shoppingItems])

  const openItems = items.filter((item) => !item.checked)
  const doneItems = items.filter((item) => item.checked)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) {
      return
    }

    createShoppingItem({
      title,
      quantity,
      category,
      created_by: createdBy,
    })

    setTitle('')
    setQuantity('')
    setCategory('groceries')
  }

  return (
    <div className="space-y-6 variant-page">
      <section className="rounded-2xl border border-[#E8D8BF] bg-[#FFF8EE] p-5 shadow-sm sm:p-6">
        <h1 className="inline-flex items-center gap-2 text-xl font-semibold text-[#3D2A18] sm:text-2xl">
          <ShoppingBasket className="h-6 w-6 text-[#C8620A]" />
          Shared Shopping List
        </h1>
        <p className="mt-1 text-sm text-[#7A644F]">
          Grocery and household checklist for both of you with shared visibility.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Metric label="To Buy" value={openItems.length} />
          <Metric label="Completed" value={doneItems.length} />
          <Metric label="Total" value={items.length} />
        </div>
      </section>

      <section className="rounded-2xl border border-[#E8D8BF] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-[#3D2A18]">Add Item</h2>
        <form onSubmit={handleSubmit} className="mt-3 grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A644F]">Item</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Tomatoes"
              className="w-full rounded-lg border border-[#E8D8BF] bg-white px-3 py-2 text-sm text-[#3D2A18] outline-none transition focus:border-[#C8620A]"
              required
            />
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A644F]">Quantity</label>
            <input
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="2 kg"
              className="w-full rounded-lg border border-[#E8D8BF] bg-white px-3 py-2 text-sm text-[#3D2A18] outline-none transition focus:border-[#C8620A]"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A644F]">Category</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as ShoppingCategory)}
              className="w-full rounded-lg border border-[#E8D8BF] bg-white px-3 py-2 text-sm text-[#3D2A18] outline-none transition focus:border-[#C8620A]"
            >
              <option value="groceries">Groceries</option>
              <option value="household">Household</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7A644F]">By</label>
            <select
              value={createdBy}
              onChange={(event) => setCreatedBy(event.target.value)}
              className="w-full rounded-lg border border-[#E8D8BF] bg-white px-3 py-2 text-sm text-[#3D2A18] outline-none transition focus:border-[#C8620A]"
            >
              <option value="David">David</option>
              <option value="Girlfriend">Girlfriend</option>
            </select>
          </div>

          <div className="lg:col-span-2 flex items-end">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#C8620A] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#A04D06]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-2xl border border-[#E8D8BF] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#3D2A18]">To Buy</h2>
            <span className="rounded-full bg-[#FFF8EE] px-2 py-0.5 text-xs font-semibold text-[#7A644F]">{openItems.length}</span>
          </div>

          {openItems.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#E8D8BF] bg-[#FFF8EE] px-3 py-6 text-center text-sm text-[#7A644F]">
              List is clear.
            </p>
          ) : (
            <ul className="space-y-2">
              {openItems.map((item) => (
                <li key={item.id} className="rounded-lg border border-[#E8D8BF] bg-[#FFF8EE] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#3D2A18]">{item.title}</p>
                      <p className="mt-1 text-[11px] text-[#7A644F]">
                        {item.quantity ?? '1'} · {CATEGORY_LABEL[item.category]} · {item.created_by}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateShoppingItem(item.id, { checked: true })}
                        className="rounded-md border border-[#E8D8BF] bg-white p-1.5 text-[#7A644F] transition-colors hover:border-[#C8620A] hover:text-[#C8620A]"
                        aria-label="Mark bought"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteShoppingItem(item.id)}
                        className="rounded-md border border-[#E8D8BF] bg-white p-1.5 text-[#7A644F] transition-colors hover:border-red-300 hover:text-red-700"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-2xl border border-[#E8D8BF] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#3D2A18]">Bought</h2>
            <span className="rounded-full bg-[#FFF8EE] px-2 py-0.5 text-xs font-semibold text-[#7A644F]">{doneItems.length}</span>
          </div>

          {doneItems.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#E8D8BF] bg-[#FFF8EE] px-3 py-6 text-center text-sm text-[#7A644F]">
              Nothing completed yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {doneItems.map((item) => (
                <li key={item.id} className="rounded-lg border border-[#E2C79B] bg-[#F5EAD8] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#4A3520]">{item.title}</p>
                      <p className="mt-1 text-[11px] text-[#7A6040]">
                        {item.quantity ?? '1'} · {CATEGORY_LABEL[item.category]}
                      </p>
                    </div>
                    <button
                      onClick={() => updateShoppingItem(item.id, { checked: false })}
                      className="rounded-md border border-[#E2C79B] bg-white p-1.5 text-[#7A6040] transition-colors hover:border-[#C8620A] hover:text-[#C8620A]"
                      aria-label="Move back"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#E8D8BF] bg-white px-3 py-3">
      <p className="text-xs uppercase tracking-[0.14em] text-[#7A644F]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#3D2A18]">{value}</p>
    </div>
  )
}
