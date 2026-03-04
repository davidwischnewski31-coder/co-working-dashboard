'use client'

import { JourneyPanel } from '@/components/variant/JourneyPanel'

import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, ExternalLink, Plus } from 'lucide-react'
import { useWorkspace } from '@/components/providers/WorkspaceProvider'
import { formatDate } from '@/lib/utils'
import type { ArticleStatus } from '@/lib/workspace'

const statusClasses: Record<ArticleStatus, string> = {
  unread: 'bg-[#F5F4F2] text-[#7A6F65]',
  reading: 'bg-[#FEF3E2] text-[#7A3908]',
  read: 'bg-[#FEF3E2] text-[#7A3908]',
  archived: 'bg-[#F5F4F2] text-[#7A6F65]',
}

function sourceFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default function ReadingPage() {
  const { data, createReadingList, addArticle, updateArticleStatus, createTask, createIdea } = useWorkspace()

  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [listName, setListName] = useState('')
  const [listDescription, setListDescription] = useState('')
  const [articleUrl, setArticleUrl] = useState('')
  const [articleTitle, setArticleTitle] = useState('')
  const [actionPromptArticleId, setActionPromptArticleId] = useState<string | null>(null)
  const promptTimerRef = useRef<number | null>(null)

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

  useEffect(() => {
    return () => {
      if (promptTimerRef.current !== null) {
        window.clearTimeout(promptTimerRef.current)
      }
    }
  }, [])

  function showActionPrompt(articleId: string) {
    if (promptTimerRef.current !== null) {
      window.clearTimeout(promptTimerRef.current)
      promptTimerRef.current = null
    }

    setActionPromptArticleId(articleId)
  }

  function dismissActionPrompt() {
    if (promptTimerRef.current !== null) {
      window.clearTimeout(promptTimerRef.current)
      promptTimerRef.current = null
    }
    setActionPromptArticleId(null)
  }

  function handleMarkComplete(articleId: string) {
    updateArticleStatus(articleId, 'read')
    showActionPrompt(articleId)
  }

  return (
    <div className="space-y-6 variant-page variant-page-reading">
      <JourneyPanel page="reading" />

      <section className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1C1714] sm:text-2xl">Reading Queue</h1>
            <p className="mt-1 text-sm text-[#7A6F65]">
              Keep input organized so strategy and product decisions happen faster.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#F5F4F2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">
            <BookOpen className="h-3.5 w-3.5" />
            {data.articles.length} total articles
          </span>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[260px_1fr]">
        <aside className="space-y-2 rounded-2xl border border-[#E8E2D8] bg-white p-3 shadow-sm">
          {data.readingLists.map((list) => {
            const listArticles = data.articles.filter((article) => article.reading_list_id === list.id)
            const listUnread = listArticles.filter((article) => article.status === 'unread').length

            return (
              <button
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                  activeListId === list.id
                    ? 'border-[#E8E2D8] bg-[#FEF3E2] text-[#7A3908]'
                    : 'border-transparent bg-[#FAFAF9] text-[#7A6F65] hover:border-[#E8E2D8]'
                }`}
              >
                <p className="text-sm font-semibold">{list.name}</p>
                <p className="mt-0.5 text-xs text-[#7A6F65]">
                  {listArticles.length} articles • {listUnread} unread
                </p>
              </button>
            )
          })}
        </aside>

        <article className="rounded-2xl border border-[#E8E2D8] bg-white p-5 shadow-sm sm:p-6">
          {selectedList ? (
            <>
              <header className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#1C1714]">{selectedList.name}</h2>
                  <p className="mt-1 text-sm text-[#7A6F65]">
                    {selectedList.description || 'No description'}
                  </p>
                </div>
                <span className="rounded-full bg-[#F5F4F2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">
                  {unreadCount} unread
                </span>
              </header>

              <div className="space-y-3">
                {articlesForSelectedList.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#E8E2D8] px-4 py-8 text-center text-sm text-[#7A6F65]">
                    No articles in this list yet.
                  </div>
                ) : null}

                {articlesForSelectedList.map((article) => (
                  <div key={article.id} className="rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex max-w-full items-center gap-1 text-sm font-semibold text-[#1C1714] hover:text-[#C8620A]"
                        >
                          <span className="truncate">{article.title}</span>
                          <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                        </a>
                        <p className="mt-1 truncate text-xs text-[#7A6F65]">{sourceFromUrl(article.url)}</p>
                        <p className="mt-1 text-xs text-[#7A6F65]">Added {formatDate(article.added_at)}</p>
                      </div>

                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[article.status]}`}>
                        {article.status}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      {article.status === 'unread' && (
                        <button
                          onClick={() => updateArticleStatus(article.id, 'reading')}
                          className="rounded-lg bg-[#C8620A] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#A04D06]"
                        >
                          Start reading
                        </button>
                      )}
                      {article.status === 'reading' && (
                        <button
                          onClick={() => handleMarkComplete(article.id)}
                          className="rounded-lg bg-[#C8620A] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#A04D06]"
                        >
                          Mark complete
                        </button>
                      )}
                      {article.status !== 'archived' && (
                        <button
                          onClick={() => updateArticleStatus(article.id, 'archived')}
                          className="rounded-lg border border-[#E8E2D8] px-3 py-1.5 text-xs font-medium text-[#7A6F65] transition-colors hover:border-[#D0C8BE]"
                        >
                          Archive
                        </button>
                      )}
                    </div>

                    {actionPromptArticleId === article.id ? (
                      <div className="mt-3 rounded-lg border border-[#E8E2D8] bg-white px-3 py-2">
                        <p className="text-xs font-semibold text-[#1C1714]">What action does this inspire?</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => {
                              createTask({
                                title: article.title,
                                description: `Created from reading: ${article.url}`,
                                priority: 'medium',
                                owner_type: 'human',
                                tags: ['reading'],
                              })
                              dismissActionPrompt()
                            }}
                            className="rounded-md bg-[#C8620A] px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[#A04D06]"
                            type="button"
                          >
                            Create task
                          </button>
                          <button
                            onClick={() => {
                              createIdea({
                                title: article.title,
                                description: `Captured from reading: ${article.url}`,
                                category: 'research',
                                owner_type: 'human',
                                status: 'brainstorm',
                              })
                              dismissActionPrompt()
                            }}
                            className="rounded-md border border-[#E8E2D8] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#7A644F] transition-colors hover:border-[#D0C8BE]"
                            type="button"
                          >
                            Capture idea
                          </button>
                          <button
                            onClick={dismissActionPrompt}
                            className="text-[11px] font-semibold text-[#7A644F] underline-offset-2 hover:underline"
                            type="button"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-[#E8E2D8] px-4 py-8 text-center text-sm text-[#7A6F65]">
              Create a reading list to get started.
            </div>
          )}
        </article>
      </section>

      <section className="rounded-2xl border border-[#E8E2D8] bg-[#FFFDF8] p-4 shadow-sm sm:p-5">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl border border-[#E8E2D8] bg-white px-4 py-3">
            <span className="text-sm font-semibold text-[#1C1714]">Create list or add article</span>
            <span className="text-xs text-[#7A6F65] group-open:hidden">Expand</span>
            <span className="hidden text-xs text-[#7A6F65] group-open:inline">Collapse</span>
          </summary>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <form onSubmit={handleCreateList} className="rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] p-4">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">Create list</h2>
              <div className="space-y-2">
                <input
                  value={listName}
                  onChange={(event) => setListName(event.target.value)}
                  placeholder="List name"
                  className="w-full rounded-lg border border-[#E8E2D8] bg-white px-3 py-2 text-sm text-[#1C1714]"
                />
                <input
                  value={listDescription}
                  onChange={(event) => setListDescription(event.target.value)}
                  placeholder="Description (optional)"
                  className="w-full rounded-lg border border-[#E8E2D8] bg-white px-3 py-2 text-sm text-[#1C1714]"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1C1714] px-3 py-2 text-sm font-semibold text-white"
                >
                  <Plus className="h-4 w-4" />
                  Add list
                </button>
              </div>
            </form>

            <form onSubmit={handleAddArticle} className="rounded-xl border border-[#E8E2D8] bg-[#FAFAF9] p-4">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#7A6F65]">Add article</h2>
              <div className="space-y-2">
                <input
                  value={articleUrl}
                  onChange={(event) => setArticleUrl(event.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-[#E8E2D8] bg-white px-3 py-2 text-sm text-[#1C1714]"
                />
                <input
                  value={articleTitle}
                  onChange={(event) => setArticleTitle(event.target.value)}
                  placeholder="Optional title"
                  className="w-full rounded-lg border border-[#E8E2D8] bg-white px-3 py-2 text-sm text-[#1C1714]"
                />
                <button
                  type="submit"
                  disabled={!activeListId}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#C8620A] px-3 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-[#E8D8C8] disabled:text-[#A89080]"
                >
                  <Plus className="h-4 w-4" />
                  Add to current list
                </button>
              </div>
            </form>
          </div>
        </details>
      </section>
    </div>
  )
}
