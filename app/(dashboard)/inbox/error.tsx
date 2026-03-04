'use client'

import { STORAGE_KEY } from '@/lib/workspace'

export default function InboxError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  function handleResetInbox() {
    window.localStorage.removeItem(STORAGE_KEY)
    reset()
  }

  return (
    <div className="space-y-4 rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
      <h1 className="text-xl font-semibold text-[#1C1714] sm:text-2xl">Inbox temporarily unavailable</h1>
      <p className="text-sm text-[#7A6F65]">
        We hit a local data issue while rendering Inbox. You can retry, or reset local workspace data.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-[#E8E2D8] bg-white px-3 py-2 text-sm font-semibold text-[#7A6F65] transition-colors hover:bg-[#FAFAF9]"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={handleResetInbox}
          className="rounded-lg bg-[#C8620A] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#A04D06]"
        >
          Reset local data
        </button>
      </div>
    </div>
  )
}
