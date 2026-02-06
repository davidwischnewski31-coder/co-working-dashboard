'use client'

import { usePathname } from 'next/navigation'

const pageTitles: Record<string, string> = {
  '/': 'Overview',
  '/kanban': 'Kanban Board',
  '/projects': 'Projects',
  '/ideas': 'Ideas',
  '/reading': 'Reading Lists',
  '/activity': 'Activity Log',
}

export function Header() {
  const pathname = usePathname()
  const title = pageTitles[pathname] || 'Dashboard'

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        {/* Add search, notifications, etc. here */}
      </div>
    </header>
  )
}
