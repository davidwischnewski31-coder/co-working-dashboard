'use client'

interface AttributionBadgeProps {
  owner: string
  ownerType: 'human' | 'agent'
  metadata?: {
    model?: string
    iterations?: number
    tokens?: number
  } | null
}

export function AttributionBadge({ owner, ownerType, metadata }: AttributionBadgeProps) {
  if (ownerType === 'human') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
        👤 {owner}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
      🤖 {owner}
      {metadata?.model && (
        <span className="text-purple-600 ml-0.5">({metadata.model})</span>
      )}
    </span>
  )
}
