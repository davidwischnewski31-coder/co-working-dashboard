'use client'

import { JourneyPanel } from '@/components/variant/JourneyPanel'

import { useMemo, useState } from 'react'
import { BookOpen, Check, ExternalLink, Plus } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { formatDate } from '@/lib/utils'
import type { ArticleStatus } from '@/lib/workspace'

const statusClasses: Record<ArticleStatus, string> = {
  unread: 'bg-slate-100 text-slate-700',
  reading: 'bg-blue-100 text-blue-700',
  read: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-zinc-100 text-zinc-700',
}

export default function ReadingPage() {
  const { data, createReadingList, addArticle, updateArticleStatus } = useWorkspace()

  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [listName, setListName] = useState('')
  const [listDescription, setListDescription] = useState('')
  const [articleUrl, setArticleUrl] = useState('')
  const [articleTitle, setArticleTitle] = useState('')

  const activeListId = useMemo(() => {
    if (selectedListId && data.readingLists.some((list) => list.id === selectedListId)) {
      return selectedListId
    }

    return data.readingLists[0]?.id ?? null
  }, [data.readingLists, selectedListId])

  const selectedList = data.readingLists.find((list) => list.id === activeListId) ?? null

  const articlesForSelectedList = useMemo(() => {
    if (!activeListId) {
      return []
    }

    return data.articles.filter((article) => article.reading_list_id === activeListId)
  }, [activeListId, data.articles])

  function handleCreateList(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedName = listName.trim()
    if (!normalizedName) {
      return
    }

    createReadingList({
      name: normalizedName,
      description: listDescription,
    })

    setListName('')
    setListDescription('')
  }

  function handleAddArticle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!activeListId) {
      return
    }

    const normalizedUrl = articleUrl.trim()
    if (!normalizedUrl) {
      return
    }

    addArticle({
      reading_list_id: activeListId,
      url: normalizedUrl,
      title: articleTitle,
    })

    setArticleUrl('')
    setArticleTitle('')
  }

  const unreadCount = articlesForSelectedList.filter((article) => article.status === 'unread').length

  return (
    <div className="space-y-6 variant-page variant-page-reading">
      <JourneyPanel page="reading" />
      <section className="rounded-2xl border border-[#e6dac6] bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Reading Queue</h1>
            <p className="mt-1 text-sm text-slate-500">
              Keep input organized so strategy and product decisions happen faster.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#fff5e8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-orange-700">
            <BookOpen className="h-3.5 w-3.5" />
            {data.articles.length} total articles
          </span>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <form onSubmit={handleCreateList} className="rounded-xl border border-[#eee2d0] bg-[#fffdf9] p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">Create list</h2>
            <div className="space-y-2">
              <input
                value={listName}
                onChange={(event) => setListName(event.target.value)}
                placeholder="List name"
                className="w-full rounded-lg border border-[#e8dcc8] bg-white px-3 py-2 text-sm text-slate-800"
              />
              <input
                value={listDescription}
                onChange={(event) => setListDescription(event.target.value)}
                placeholder="Description (optional)"
                className="w-full rounded-lg border border-[#e8dcc8] bg-white px-3 py-2 text-sm text-slate-800"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Add list
              </button>
            </div>
          </form>

          <form onSubmit={handleAddArticle} className="rounded-xl border border-[#eee2d0] bg-[#fffdf9] p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">Add article</h2>
            <div className="space-y-2">
              <input
                value={articleUrl}
                onChange={(event) => setArticleUrl(event.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-[#e8dcc8] bg-white px-3 py-2 text-sm text-slate-800"
              />
              <input
                value={articleTitle}
                onChange={(event) => setArticleTitle(event.target.value)}
                placeholder="Optional title"
                className="w-full rounded-lg border border-[#e8dcc8] bg-white px-3 py-2 text-sm text-slate-800"
              />
              <button
                type="submit"
                disabled={!activeListId}
                className="inline-flex items-center gap-2 rounded-lg bg-[#ef6c00] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add to current list
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[260px_1fr]">
        <aside className="space-y-2 rounded-2xl border border-[#e6dac6] bg-white p-3 shadow-sm">
          {data.readingLists.map((list) => {
            const listArticles = data.articles.filter((article) => article.reading_list_id === list.id)
            const listUnread = listArticles.filter((article) => article.status === 'unread').length

            return (
              <button
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                  activeListId === list.id
                    ? 'border-orange-300 bg-orange-50 text-orange-900'
                    : 'border-transparent bg-[#fffdf8] text-slate-700 hover:border-[#eadfcf]'
                }`}
              >
                <p className="text-sm font-semibold">{list.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {listArticles.length} articles • {listUnread} unread
                </p>
              </button>
            )
          })}
        </aside>

        <article className="rounded-2xl border border-[#e6dac6] bg-white p-5 shadow-sm sm:p-6">
          {selectedList ? (
            <>
              <header className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{selectedList.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedList.description || 'No description'}
                  </p>
                </div>
                <span className="rounded-full bg-[#fff5e8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-orange-700">
                  {unreadCount} unread
                </span>
              </header>

              <div className="space-y-3">
                {articlesForSelectedList.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#e8dcc8] px-4 py-8 text-center text-sm text-slate-500">
                    No articles in this list yet.
                  </div>
                ) : null}

                {articlesForSelectedList.map((article) => (
                  <div key={article.id} className="rounded-xl border border-[#ebe0ce] bg-[#fffdf9] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex max-w-full items-center gap-1 text-sm font-semibold text-slate-900 hover:text-orange-700"
                        >
                          <span className="truncate">{article.title}</span>
                          <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                        </a>
                        <p className="mt-1 truncate text-xs text-slate-500">{article.url}</p>
                        <p className="mt-1 text-xs text-slate-500">Added {formatDate(article.added_at)}</p>
                      </div>

                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[article.status]}`}>
                        {article.status}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => updateArticleStatus(article.id, 'reading')}
                        className="rounded-md border border-[#e7dbc7] bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Mark reading
                      </button>
                      <button
                        onClick={() => updateArticleStatus(article.id, 'read')}
                        className="inline-flex items-center gap-1 rounded-md border border-[#d8ecdd] bg-[#f3fbf4] px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-[#eaf7ec]"
                      >
                        <Check className="h-3 w-3" />
                        Mark read
                      </button>
                      <button
                        onClick={() => updateArticleStatus(article.id, 'archived')}
                        className="rounded-md border border-[#e7dbc7] bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-[#e8dcc8] px-4 py-8 text-center text-sm text-slate-500">
              Create a reading list to get started.
            </div>
          )}
        </article>
      </section>
    </div>
  )
}
